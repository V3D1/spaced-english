'use client';

import { useState } from 'react';
import { getWeeklyAIRecommendations } from './ai-actions';
import { Brain, Loader2, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FocusCollocation {
  id: number;
  phrase: string;
  domain: string;
}

interface Recommendations {
  focusCollocations: FocusCollocation[];
  patternAnalysis: string;
  difficultyAdvice: string;
}

export function AIReviewPanel() {
  const [recommendations, setRecommendations] =
    useState<Recommendations | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const result = await getWeeklyAIRecommendations();
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      if (result.recommendations) {
        setRecommendations(result.recommendations);
      }
    } catch {
      toast.error('Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="border rounded-xl p-4 bg-card space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <p className="text-sm font-medium">AI Weekly Review</p>
      </div>

      {!recommendations ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Get personalized recommendations based on your learning patterns.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 disabled:opacity-50 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Generate Recommendations'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Focus collocations */}
          {recommendations.focusCollocations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Target className="h-3.5 w-3.5" />
                Focus This Week
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendations.focusCollocations.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
                  >
                    {c.phrase}
                    <span className="text-muted-foreground">({c.domain})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pattern analysis */}
          {recommendations.patternAnalysis && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                Pattern Analysis
              </div>
              <p className="text-sm text-muted-foreground">
                {recommendations.patternAnalysis}
              </p>
            </div>
          )}

          {/* Difficulty advice */}
          {recommendations.difficultyAdvice && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Difficulty Advice
              </div>
              <p className="text-sm text-muted-foreground">
                {recommendations.difficultyAdvice}
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {isLoading ? 'Refreshing...' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  );
}
