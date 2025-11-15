/**
 * Website Content Search Service
 * Performs semantic search over website embeddings
 */

const { supabase } = require('./config');
const { generateEmbedding } = require('./websiteEmbeddingService');

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} Cosine similarity (0-1)
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search website content using semantic similarity
 * @param {string} query - User's search query
 * @param {string} tenantId - Tenant ID
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Relevant content chunks
 */
async function searchWebsiteContent(query, tenantId, options = {}) {
    const {
        limit = 5,
        contentType = null, // Filter by content type if specified
        minSimilarity = 0.7, // Minimum similarity threshold (0-1)
        includeMetadata = true
    } = options;

    console.log(`[WebsiteSearch] Searching for: "${query}" (tenant: ${tenantId})`);

    try {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);
        
        // Format embedding for pgvector (convert array to string)
        const embeddingString = `[${queryEmbedding.join(',')}]`;

        // Build query with direct vector similarity
        let query_builder = supabase
            .from('website_embeddings')
            .select('id, url, page_title, chunk_text, content_type, embedding')
            .eq('tenant_id', tenantId)
            .eq('status', 'active');
        
        if (contentType) {
            query_builder = query_builder.eq('content_type', contentType);
        }

        const { data, error } = await query_builder.limit(50); // Get more candidates

        if (error) {
            throw error;
        }

        // Calculate cosine similarity for each result
        const resultsWithSimilarity = data.map(item => {
            const itemEmbedding = JSON.parse(item.embedding);
            let similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
            
            // Boost score for keyword matches in URL/title
            const queryLower = query.toLowerCase();
            const urlLower = item.url.toLowerCase();
            const titleLower = item.page_title.toLowerCase();
            
            // Boost for specific keyword matches
            if (queryLower.includes('product') && (urlLower.includes('/products') || titleLower.includes('range'))) {
                similarity *= 1.3; // 30% boost for products page when asking about products
            }
            if (queryLower.includes('about') && (urlLower.includes('/about') || titleLower.includes('about'))) {
                similarity *= 1.3; // 30% boost for about page
            }
            if (queryLower.includes('contact') && (urlLower.includes('/contact') || titleLower.includes('contact'))) {
                similarity *= 1.3; // 30% boost for contact page
            }
            
            return {
                ...item,
                similarity
            };
        });

        // Filter by minimum similarity, sort by score, and take top results
        const results = resultsWithSimilarity
            .filter(item => item.similarity >= minSimilarity)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => ({
                id: item.id,
                url: item.url,
                pageTitle: item.page_title,
                content: item.chunk_text,
                contentType: item.content_type,
                similarity: item.similarity,
                relevanceScore: Math.round(item.similarity * 100)
            }));

        console.log(`[WebsiteSearch] Found ${results.length} relevant chunks (threshold: ${minSimilarity})`);

        return results;

    } catch (error) {
        console.error('[WebsiteSearch] Error searching content:', error.message);
        throw error;
    }
}

/**
 * Search with automatic query expansion
 * @param {string} query - User's query
 * @param {string} tenantId - Tenant ID
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Combined results
 */
async function searchWithExpansion(query, tenantId, options = {}) {
    // Generate related queries (simple keyword expansion)
    const expandedQueries = expandQuery(query);
    
    const allResults = [];
    const seenIds = new Set();

    // Search with each expanded query
    for (const expandedQuery of expandedQueries) {
        const results = await searchWebsiteContent(expandedQuery, tenantId, {
            ...options,
            limit: 3 // Fewer results per query variant
        });

        // Deduplicate by ID
        results.forEach(result => {
            if (!seenIds.has(result.id)) {
                seenIds.add(result.id);
                allResults.push(result);
            }
        });
    }

    // Sort by relevance
    allResults.sort((a, b) => b.similarity - a.similarity);

    return allResults.slice(0, options.limit || 5);
}

/**
 * Expand query with synonyms and variations
 */
function expandQuery(query) {
    const queries = [query];
    
    // Add variations (customize based on your domain)
    const synonyms = {
        'price': ['pricing', 'cost', 'rate'],
        'spec': ['specification', 'technical details'],
        'buy': ['purchase', 'order'],
        'product': ['item', 'goods']
    };

    const queryLower = query.toLowerCase();
    for (const [word, alternatives] of Object.entries(synonyms)) {
        if (queryLower.includes(word)) {
            alternatives.forEach(alt => {
                queries.push(query.replace(new RegExp(word, 'gi'), alt));
            });
        }
    }

    return queries.slice(0, 3); // Limit to avoid too many searches
}

/**
 * Get all crawled URLs for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of crawled URLs with metadata
 */
async function getCrawledUrls(tenantId) {
    try {
        const { data, error } = await supabase
            .from('website_embeddings')
            .select('url, page_title, content_type, crawl_date, status')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .order('crawl_date', { ascending: false });

        if (error) throw error;

        // Group by URL (since we have multiple chunks per URL)
        const urlMap = new Map();
        data.forEach(item => {
            if (!urlMap.has(item.url)) {
                urlMap.set(item.url, {
                    url: item.url,
                    pageTitle: item.page_title,
                    contentType: item.content_type,
                    crawlDate: item.crawl_date,
                    status: item.status,
                    chunkCount: 1
                });
            } else {
                urlMap.get(item.url).chunkCount++;
            }
        });

        return Array.from(urlMap.values());

    } catch (error) {
        console.error('[WebsiteSearch] Error getting crawled URLs:', error.message);
        throw error;
    }
}

/**
 * Get statistics about website embeddings
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Statistics
 */
async function getEmbeddingStats(tenantId) {
    try {
        const { data, error } = await supabase
            .from('website_embeddings')
            .select('url, content_type, status')
            .eq('tenant_id', tenantId);

        if (error) throw error;

        const stats = {
            totalChunks: data.length,
            totalUrls: new Set(data.map(item => item.url)).size,
            activeChunks: data.filter(item => item.status === 'active').length,
            byContentType: {}
        };

        // Count by content type
        data.forEach(item => {
            stats.byContentType[item.content_type] = 
                (stats.byContentType[item.content_type] || 0) + 1;
        });

        return stats;

    } catch (error) {
        console.error('[WebsiteSearch] Error getting stats:', error.message);
        throw error;
    }
}

/**
 * Find product information from website content
 * @param {string} productCode - Product code to search for
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Relevant product information
 */
async function findProductInfo(productCode, tenantId) {
    try {
        // Search by product code in the array
        const { data, error } = await supabase
            .from('website_embeddings')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .contains('product_codes', [productCode])
            .order('crawl_date', { ascending: false })
            .limit(3);

        if (error) throw error;

        // Also do semantic search
        const semanticResults = await searchWebsiteContent(
            `${productCode} specifications pricing details`,
            tenantId,
            { limit: 3 }
        );

        // Combine and deduplicate
        const combined = [...data, ...semanticResults];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

        return unique.slice(0, 5);

    } catch (error) {
        console.error('[WebsiteSearch] Error finding product info:', error.message);
        throw error;
    }
}

/**
 * Generate answer from search results
 * @param {string} query - User's question
 * @param {Array} searchResults - Search results from vector search
 * @returns {string} Formatted answer
 */
function generateAnswerFromResults(query, searchResults) {
    if (!searchResults || searchResults.length === 0) {
        return null;
    }

    // Combine top results
    const context = searchResults
        .slice(0, 3)
        .map(result => `[${result.pageTitle}]\n${result.content}`)
        .join('\n\n---\n\n');

    return {
        context,
        sources: searchResults.map(result => ({
            title: result.pageTitle,
            url: result.url,
            relevance: result.relevanceScore
        }))
    };
}

module.exports = {
    searchWebsiteContent,
    searchWithExpansion,
    getCrawledUrls,
    getEmbeddingStats,
    findProductInfo,
    generateAnswerFromResults
};
