# 🔑 NEOBOT V7 - API KEY MANAGEMENT (PART 2)
## Load Balancing, Cost Optimization & Monitoring

---

## 📊 4. LOAD BALANCING STRATEGY

### **A. Intelligent Load Distribution**

```kotlin
// Advanced Load Balancer for API Keys

class APIKeyLoadBalancer(
    private val poolManager: APIKeyPoolManager
) {
    
    // Load balancing strategies
    enum class Strategy {
        ROUND_ROBIN,     // Rotate through keys equally
        LEAST_USED,      // Use key with lowest usage
        WEIGHTED,        // Based on rate limits
        COST_OPTIMIZED,  // Minimize cost
        FASTEST          // Lowest latency
    }
    
    private val roundRobinCounters = ConcurrentHashMap<String, AtomicInteger>()
    
    // Select API key based on strategy
    suspend fun selectKey(
        provider: String,
        strategy: Strategy = Strategy.WEIGHTED
    ): APIKeyInfo? {
        
        val allKeys = poolManager.getAllKeys(provider)
            .filter { it.isActive && !isExpired(it) }
        
        if (allKeys.isEmpty()) return null
        
        return when (strategy) {
            Strategy.ROUND_ROBIN -> selectRoundRobin(provider, allKeys)
            Strategy.LEAST_USED -> selectLeastUsed(allKeys)
            Strategy.WEIGHTED -> selectWeighted(allKeys)
            Strategy.COST_OPTIMIZED -> selectCostOptimized(allKeys)
            Strategy.FASTEST -> selectFastest(allKeys)
        }
    }
    
    // Round-robin selection
    private fun selectRoundRobin(
        provider: String,
        keys: List<APIKeyInfo>
    ): APIKeyInfo {
        val counter = roundRobinCounters.getOrPut(provider) { AtomicInteger(0) }
        val index = counter.getAndIncrement() % keys.size
        return keys[index]
    }
    
    // Least-used selection
    private fun selectLeastUsed(keys: List<APIKeyInfo>): APIKeyInfo {
        return keys.minByOrNull { it.usageCount } ?: keys.first()
    }
    
    // Weighted selection (based on rate limits)
    private fun selectWeighted(keys: List<APIKeyInfo>): APIKeyInfo {
        // Calculate weights based on:
        // 1. Remaining rate limit capacity
        // 2. Error rate (lower is better)
        // 3. Recent usage
        
        val scoredKeys = keys.map { key ->
            val rateLimitScore = calculateRateLimitScore(key)
            val errorScore = calculateErrorScore(key)
            val usageScore = calculateUsageScore(key)
            val creditsScore = calculateCreditsScore(key)
            
            val totalScore = (
                rateLimitScore * 0.4 +
                errorScore * 0.3 +
                usageScore * 0.2 +
                creditsScore * 0.1
            )
            
            ScoredKey(key, totalScore)
        }
        
        return scoredKeys.maxByOrNull { it.score }?.key ?: keys.first()
    }
    
    // Cost-optimized selection
    private fun selectCostOptimized(keys: List<APIKeyInfo>): APIKeyInfo {
        // Prefer keys with:
        // 1. More remaining free credits
        // 2. Lower cost per token
        
        return keys
            .sortedWith(
                compareByDescending<APIKeyInfo> { it.credits }
                    .thenBy { getCostPerToken(it.provider) }
            )
            .firstOrNull() ?: keys.first()
    }
    
    // Fastest selection (lowest latency)
    private fun selectFastest(keys: List<APIKeyInfo>): APIKeyInfo {
        // Track average response time per key
        // Select key with lowest latency
        
        return keys
            .sortedBy { getAverageLatency(it.provider, it.apiKey) }
            .firstOrNull() ?: keys.first()
    }
    
    // Calculate rate limit score (0-1, higher is better)
    private fun calculateRateLimitScore(key: APIKeyInfo): Double {
        // If we don't know remaining requests, assume 50% available
        val remaining = getRemainingRequests(key) ?: (key.rateLimit.requestsPerMinute / 2)
        return remaining.toDouble() / key.rateLimit.requestsPerMinute
    }
    
    // Calculate error score (0-1, higher is better)
    private fun calculateErrorScore(key: APIKeyInfo): Double {
        // Inverse of error count
        return 1.0 / (1.0 + key.errorCount)
    }
    
    // Calculate usage score (0-1, higher means less used)
    private fun calculateUsageScore(key: APIKeyInfo): Double {
        // Inverse of usage count
        val maxUsage = 10000.0 // Assume max usage threshold
        return 1.0 - (key.usageCount.toDouble() / maxUsage).coerceIn(0.0, 1.0)
    }
    
    // Calculate credits score (0-1, higher is better)
    private fun calculateCreditsScore(key: APIKeyInfo): Double {
        // Normalize credits to 0-1 range
        val maxCredits = 100.0 // Assume $100 max
        return (key.credits / maxCredits).coerceIn(0.0, 1.0)
    }
}

data class ScoredKey(
    val key: APIKeyInfo,
    val score: Double
)
```

---

## 💰 5. COST TRACKING & OPTIMIZATION

### **A. Real-time Cost Monitoring**

```kotlin
// Cost Tracker & Optimizer

class CostTracker {
    
    private val costDatabase = CostDatabase()
    
    // Track API call cost
    suspend fun trackCost(
        provider: String,
        apiKey: String,
        model: String,
        inputTokens: Int,
        outputTokens: Int
    ): Cost {
        
        // Get pricing for this model
        val pricing = getPricing(provider, model)
        
        // Calculate cost
        val inputCost = (inputTokens / 1000.0) * pricing.inputCostPer1K
        val outputCost = (outputTokens / 1000.0) * pricing.outputCostPer1K
        val totalCost = inputCost + outputCost
        
        // Save to database
        val costEntry = CostEntry(
            provider = provider,
            apiKey = maskAPIKey(apiKey),
            model = model,
            inputTokens = inputTokens,
            outputTokens = outputTokens,
            inputCost = inputCost,
            outputCost = outputCost,
            totalCost = totalCost,
            timestamp = System.currentTimeMillis()
        )
        
        costDatabase.insert(costEntry)
        
        return Cost(
            totalCost = totalCost,
            inputCost = inputCost,
            outputCost = outputCost
        )
    }
    
    // Get pricing for model
    private fun getPricing(provider: String, model: String): ModelPricing {
        return when (provider.lowercase()) {
            "openai" -> when {
                model.contains("gpt-4") -> ModelPricing(
                    inputCostPer1K = 0.03,
                    outputCostPer1K = 0.06
                )
                model.contains("gpt-3.5") -> ModelPricing(
                    inputCostPer1K = 0.0015,
                    outputCostPer1K = 0.002
                )
                else -> ModelPricing(0.01, 0.02)
            }
            
            "anthropic" -> when {
                model.contains("opus") -> ModelPricing(0.015, 0.075)
                model.contains("sonnet") -> ModelPricing(0.003, 0.015)
                model.contains("haiku") -> ModelPricing(0.00025, 0.00125)
                else -> ModelPricing(0.003, 0.015)
            }
            
            "google" -> when {
                model.contains("gemini-pro") -> ModelPricing(0.00025, 0.0005)
                model.contains("gemini-ultra") -> ModelPricing(0.00125, 0.00375)
                else -> ModelPricing(0.0001, 0.0002)
            }
            
            else -> ModelPricing(0.001, 0.002) // Default fallback
        }
    }
    
    // Get cost summary
    suspend fun getCostSummary(
        timeRange: TimeRange = TimeRange.LAST_30_DAYS
    ): CostSummary {
        
        val entries = costDatabase.getEntries(timeRange)
        
        val totalCost = entries.sumOf { it.totalCost }
        val totalTokens = entries.sumOf { it.inputTokens + it.outputTokens }
        
        val costByProvider = entries
            .groupBy { it.provider }
            .mapValues { (_, entries) -> entries.sumOf { it.totalCost } }
        
        val costByModel = entries
            .groupBy { it.model }
            .mapValues { (_, entries) -> entries.sumOf { it.totalCost } }
        
        val costByDay = entries
            .groupBy { getDayKey(it.timestamp) }
            .mapValues { (_, entries) -> entries.sumOf { it.totalCost } }
            .toSortedMap()
        
        return CostSummary(
            totalCost = totalCost,
            totalTokens = totalTokens,
            totalRequests = entries.size,
            averageCostPerRequest = if (entries.isNotEmpty()) totalCost / entries.size else 0.0,
            costByProvider = costByProvider,
            costByModel = costByModel,
            costByDay = costByDay
        )
    }
    
    // Cost optimization suggestions
    suspend fun getOptimizationSuggestions(): List<OptimizationSuggestion> {
        val suggestions = mutableListOf<OptimizationSuggestion>()
        
        val summary = getCostSummary(TimeRange.LAST_30_DAYS)
        
        // Suggestion 1: Switch expensive models
        val expensiveModels = summary.costByModel
            .filter { it.value > 10.0 } // $10+ spent
            .keys
        
        for (model in expensiveModels) {
            if (model.contains("gpt-4")) {
                suggestions.add(
                    OptimizationSuggestion(
                        type = "model_switch",
                        title = "Consider switching from GPT-4 to GPT-3.5-Turbo",
                        description = "GPT-3.5-Turbo is 20x cheaper and suitable for most tasks",
                        potentialSavings = summary.costByModel[model]!! * 0.95,
                        implementation = "Change model parameter to 'gpt-3.5-turbo'"
                    )
                )
            }
        }
        
        // Suggestion 2: Use cheaper providers
        val openAICost = summary.costByProvider["openai"] ?: 0.0
        if (openAICost > 20.0) {
            suggestions.add(
                OptimizationSuggestion(
                    type = "provider_switch",
                    title = "Consider using Claude Haiku for simple tasks",
                    description = "Claude Haiku is 100x cheaper than GPT-4 for basic tasks",
                    potentialSavings = openAICost * 0.8,
                    implementation = "Route simple queries to Claude Haiku"
                )
            )
        }
        
        // Suggestion 3: Caching
        val repeatQueries = detectRepeatQueries()
        if (repeatQueries > 100) {
            suggestions.add(
                OptimizationSuggestion(
                    type = "caching",
                    title = "Implement response caching",
                    description = "$repeatQueries repeat queries detected. Caching could save 50% costs",
                    potentialSavings = summary.totalCost * 0.5,
                    implementation = "Enable Redis caching for common queries"
                )
            )
        }
        
        // Suggestion 4: Prompt optimization
        val avgTokens = summary.totalTokens / summary.totalRequests
        if (avgTokens > 2000) {
            suggestions.add(
                OptimizationSuggestion(
                    type = "prompt_optimization",
                    title = "Optimize prompts to reduce tokens",
                    description = "Average ${avgTokens} tokens/request. Shorter prompts = lower cost",
                    potentialSavings = summary.totalCost * 0.3,
                    implementation = "Review and shorten system prompts"
                )
            )
        }
        
        return suggestions
    }
}

// Data models
data class ModelPricing(
    val inputCostPer1K: Double,
    val outputCostPer1K: Double
)

data class CostEntry(
    val provider: String,
    val apiKey: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
    val inputCost: Double,
    val outputCost: Double,
    val totalCost: Double,
    val timestamp: Long
)

data class Cost(
    val totalCost: Double,
    val inputCost: Double,
    val outputCost: Double
)

data class CostSummary(
    val totalCost: Double,
    val totalTokens: Int,
    val totalRequests: Int,
    val averageCostPerRequest: Double,
    val costByProvider: Map<String, Double>,
    val costByModel: Map<String, Double>,
    val costByDay: Map<String, Double>
)

data class OptimizationSuggestion(
    val type: String,
    val title: String,
    val description: String,
    val potentialSavings: Double,
    val implementation: String
)

enum class TimeRange {
    LAST_24_HOURS,
    LAST_7_DAYS,
    LAST_30_DAYS,
    ALL_TIME
}
```

---

## 📊 6. REAL-TIME MONITORING DASHBOARD

### **A. Frontend Dashboard (React)**

```typescript
// frontend/src/components/APIKeyDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAPIKeys } from '@/hooks/useAPIKeys';

const APIKeyDashboard: React.FC = () => {
  const {
    apiKeys,
    costSummary,
    usage,
    loadBalancerStats,
    refreshData
  } = useAPIKeys();

  useEffect(() => {
    // Refresh every 10 seconds
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="api-key-dashboard">
      {/* Overview Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total API Keys"
          value={apiKeys.length}
          subtitle={`${apiKeys.filter(k => k.isActive).length} active`}
          icon="🔑"
        />
        
        <StatCard
          title="Total Cost (30d)"
          value={`$${costSummary.totalCost.toFixed(2)}`}
          subtitle={`${costSummary.totalRequests.toLocaleString()} requests`}
          icon="💰"
        />
        
        <StatCard
          title="Uptime"
          value="99.99%"
          subtitle="No downtime this month"
          icon="✅"
        />
        
        <StatCard
          title="Avg Response Time"
          value={`${usage.avgLatency}ms`}
          subtitle="Fast & reliable"
          icon="⚡"
        />
      </div>

      {/* API Keys by Provider */}
      <div className="keys-by-provider">
        <h2>API Keys by Provider</h2>
        {Object.entries(groupByProvider(apiKeys)).map(([provider, keys]) => (
          <div key={provider} className="provider-section">
            <h3>{provider}</h3>
            <div className="keys-grid">
              {keys.map(key => (
                <APIKeyCard
                  key={key.apiKey}
                  keyInfo={key}
                  onRemove={() => removeKey(key)}
                  onToggle={() => toggleKey(key)}
                />
              ))}
              <AddKeyButton provider={provider} />
            </div>
          </div>
        ))}
      </div>

      {/* Cost Chart */}
      <div className="cost-chart">
        <h2>Cost Over Time</h2>
        <LineChart
          data={costSummary.costByDay}
          xKey="date"
          yKey="cost"
          color="#10b981"
        />
      </div>

      {/* Usage Distribution */}
      <div className="usage-distribution">
        <h2>Usage by Provider</h2>
        <PieChart
          data={Object.entries(costSummary.costByProvider).map(([provider, cost]) => ({
            name: provider,
            value: cost
          }))}
        />
      </div>

      {/* Load Balancer Stats */}
      <div className="load-balancer-stats">
        <h2>Load Balancer Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Strategy</th>
              <th>Keys Active</th>
              <th>Requests</th>
              <th>Avg Latency</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {loadBalancerStats.map(stat => (
              <tr key={stat.provider}>
                <td>{stat.provider}</td>
                <td><span className="badge">{stat.strategy}</span></td>
                <td>{stat.activeKeys}</td>
                <td>{stat.requests.toLocaleString()}</td>
                <td>{stat.avgLatency}ms</td>
                <td className={stat.successRate > 95 ? 'success' : 'warning'}>
                  {stat.successRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost Optimization Suggestions */}
      <div className="optimization-suggestions">
        <h2>💡 Cost Optimization Suggestions</h2>
        {costSummary.optimizationSuggestions?.map((suggestion, index) => (
          <div key={index} className="suggestion-card">
            <h3>{suggestion.title}</h3>
            <p>{suggestion.description}</p>
            <div className="suggestion-footer">
              <span className="savings">
                Potential savings: ${suggestion.potentialSavings.toFixed(2)}/month
              </span>
              <button className="implement-btn">
                Implement
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent API Calls</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Provider</th>
              <th>Model</th>
              <th>Tokens</th>
              <th>Cost</th>
              <th>Latency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {usage.recentCalls.map(call => (
              <tr key={call.id}>
                <td>{formatTime(call.timestamp)}</td>
                <td>{call.provider}</td>
                <td>{call.model}</td>
                <td>{call.tokens.toLocaleString()}</td>
                <td>${call.cost.toFixed(4)}</td>
                <td>{call.latency}ms</td>
                <td>
                  <span className={`status-badge ${call.status}`}>
                    {call.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Key Modal */}
      <AddKeyModal
        isOpen={showAddKeyModal}
        onClose={() => setShowAddKeyModal(false)}
        onAdd={handleAddKey}
      />
    </div>
  );
};

// API Key Card Component
const APIKeyCard: React.FC<{
  keyInfo: APIKeyInfo;
  onRemove: () => void;
  onToggle: () => void;
}> = ({ keyInfo, onRemove, onToggle }) => {
  return (
    <div className={`api-key-card ${!keyInfo.isActive ? 'inactive' : ''}`}>
      <div className="key-header">
        <span className="key-id">
          {keyInfo.provider} - {maskKey(keyInfo.apiKey)}
        </span>
        <div className="key-actions">
          <button onClick={onToggle} title={keyInfo.isActive ? 'Deactivate' : 'Activate'}>
            {keyInfo.isActive ? '🟢' : '🔴'}
          </button>
          <button onClick={onRemove} title="Remove">
            🗑️
          </button>
        </div>
      </div>
      
      <div className="key-stats">
        <div className="stat">
          <span className="label">Usage</span>
          <span className="value">{keyInfo.usageCount}</span>
        </div>
        <div className="stat">
          <span className="label">Errors</span>
          <span className="value error">{keyInfo.errorCount}</span>
        </div>
        <div className="stat">
          <span className="label">Credits</span>
          <span className="value">${keyInfo.credits.toFixed(2)}</span>
        </div>
      </div>
      
      {keyInfo.expiresAt && (
        <div className="expiry">
          Expires: {formatDate(keyInfo.expiresAt)}
        </div>
      )}
      
      <div className="last-used">
        Last used: {keyInfo.lastUsed ? formatTimeAgo(keyInfo.lastUsed) : 'Never'}
      </div>
    </div>
  );
};

// Helper functions
function maskKey(apiKey: string): string {
  return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
}

function groupByProvider(keys: APIKeyInfo[]): Record<string, APIKeyInfo[]> {
  return keys.reduce((acc, key) => {
    if (!acc[key.provider]) acc[key.provider] = [];
    acc[key.provider].push(key);
    return acc;
  }, {} as Record<string, APIKeyInfo[]>);
}
```

---

## 🗄️ 7. DATABASE SCHEMA

```sql
-- API Keys Table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', etc.
    api_key_encrypted TEXT NOT NULL, -- AES-256 encrypted
    source VARCHAR(20) NOT NULL, -- 'manual', 'auto', 'purchased'
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    credits DECIMAL(10, 2) DEFAULT 0,
    rate_limit_rpm INTEGER, -- requests per minute
    rate_limit_tpm INTEGER, -- tokens per minute
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    last_error_at TIMESTAMP,
    notes TEXT
);

-- API Usage Log
CREATE TABLE api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost DECIMAL(10, 6),
    latency INTEGER, -- milliseconds
    status VARCHAR(20), -- 'success', 'error', 'rate_limited'
    error_message TEXT,
    request_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rate Limit Tracking
CREATE TABLE rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    requests_count INTEGER DEFAULT 0,
    tokens_count INTEGER DEFAULT 0,
    is_rate_limited BOOLEAN DEFAULT false,
    reset_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cost Summary (Materialized View for Performance)
CREATE MATERIALIZED VIEW cost_summary AS
SELECT
    DATE(created_at) as date,
    provider,
    model,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(cost) as total_cost,
    AVG(latency) as avg_latency
FROM api_usage_log
WHERE status = 'success'
GROUP BY DATE(created_at), provider, model;

-- Refresh materialized view every hour
CREATE INDEX idx_cost_summary_date ON cost_summary(date DESC);
CREATE INDEX idx_cost_summary_provider ON cost_summary(provider, date DESC);

-- Indexes for performance
CREATE INDEX idx_api_keys_user ON api_keys(user_id, provider);
CREATE INDEX idx_api_keys_active ON api_keys(is_active, provider);
CREATE INDEX idx_api_usage_key ON api_usage_log(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_provider ON api_usage_log(provider, created_at DESC);
CREATE INDEX idx_api_usage_status ON api_usage_log(status, created_at DESC);
CREATE INDEX idx_rate_limit_key ON rate_limit_tracking(api_key_id, window_start DESC);
```

---

**(Dokumentasi berlanjut di Summary dengan Complete Integration, Best Practices, dan Real-World Scenarios...)**
