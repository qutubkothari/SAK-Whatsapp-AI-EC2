const pool = require('../../config/database');

/**
 * Track AI usage and costs
 */
class CostTracker {
  constructor() {
    // Pricing per 1M tokens (Claude Sonnet 4)
    this.inputTokenCost = 3.00;   // $3 per 1M input tokens
    this.outputTokenCost = 15.00;  // $15 per 1M output tokens
  }

  /**
   * Log AI usage
   */
  async logUsage(tenantId, customerProfileId, type, tokensUsed, metadata = {}) {
    try {
      const cost = this.calculateCost(tokensUsed.input, tokensUsed.output);

      const query = `
        INSERT INTO ai_usage_logs (
          tenant_id,
          customer_profile_id,
          usage_type,
          input_tokens,
          output_tokens,
          total_tokens,
          estimated_cost_usd,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;

      await pool.query(query, [
        tenantId,
        customerProfileId,
        type,
        tokensUsed.input,
        tokensUsed.output,
        tokensUsed.input + tokensUsed.output,
        cost,
        JSON.stringify(metadata)
      ]);

    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  /**
   * Calculate cost in USD
   */
  calculateCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000000) * this.inputTokenCost;
    const outputCost = (outputTokens / 1000000) * this.outputTokenCost;
    return inputCost + outputCost;
  }

  /**
   * Get usage summary for tenant
   */
  async getUsageSummary(tenantId, days = 30) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        usage_type,
        SUM(total_tokens) as total_tokens,
        SUM(estimated_cost_usd) as total_cost,
        COUNT(*) as request_count
      FROM ai_usage_logs
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at), usage_type
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }
}

module.exports = new CostTracker();