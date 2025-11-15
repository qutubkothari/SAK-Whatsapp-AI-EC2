-- Migration: Create website_embeddings table for storing crawled content and vector embeddings
-- Purpose: Enable semantic search over website content for customer queries
-- Date: 2025-10-26

-- Create table for storing crawled website content and embeddings
CREATE TABLE IF NOT EXISTS website_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- URL and metadata
    url TEXT NOT NULL,
    page_title TEXT,
    content_type VARCHAR(50) DEFAULT 'product_page', -- product_page, technical_spec, pricing, faq
    
    -- Content
    original_content TEXT NOT NULL, -- Full page content
    chunk_text TEXT NOT NULL, -- Chunked text (for embedding)
    chunk_index INTEGER NOT NULL, -- Order of chunk in the page
    
    -- Embedding (FREE - using Hugging Face sentence-transformers)
    embedding vector(384), -- Free model: sentence-transformers/all-MiniLM-L6-v2
    
    -- Metadata for better filtering
    product_codes TEXT[], -- Array of product codes mentioned in chunk
    keywords TEXT[], -- Extracted keywords
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active', -- active, archived, error
    crawl_date TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, url, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_embeddings_tenant 
    ON website_embeddings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_website_embeddings_url 
    ON website_embeddings(tenant_id, url);

CREATE INDEX IF NOT EXISTS idx_website_embeddings_content_type 
    ON website_embeddings(tenant_id, content_type);

CREATE INDEX IF NOT EXISTS idx_website_embeddings_status 
    ON website_embeddings(tenant_id, status);

-- Create vector similarity search index (cosine distance)
CREATE INDEX IF NOT EXISTS idx_website_embeddings_vector 
    ON website_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Create table for tracking crawl jobs
CREATE TABLE IF NOT EXISTS crawl_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Job details
    url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    
    -- Statistics
    pages_crawled INTEGER DEFAULT 0,
    chunks_created INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_tenant 
    ON crawl_jobs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status 
    ON crawl_jobs(tenant_id, status);

-- Function to search for similar content using vector similarity
CREATE OR REPLACE FUNCTION search_website_content(
    p_tenant_id UUID,
    p_query_embedding vector(384),
    p_limit INTEGER DEFAULT 5,
    p_content_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    url TEXT,
    page_title TEXT,
    chunk_text TEXT,
    content_type VARCHAR(50),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        we.id,
        we.url,
        we.page_title,
        we.chunk_text,
        we.content_type,
        1 - (we.embedding <=> p_query_embedding) as similarity
    FROM website_embeddings we
    WHERE we.tenant_id = p_tenant_id
        AND we.status = 'active'
        AND (p_content_type IS NULL OR we.content_type = p_content_type)
    ORDER BY we.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON website_embeddings TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON crawl_jobs TO your_app_user;

COMMENT ON TABLE website_embeddings IS 'Stores crawled website content as text chunks with vector embeddings for semantic search';
COMMENT ON TABLE crawl_jobs IS 'Tracks website crawling jobs and their status';
COMMENT ON FUNCTION search_website_content IS 'Performs semantic search on website content using vector similarity';
