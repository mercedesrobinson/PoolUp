import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { api } from '../services/api';

const colors = {
  background: '#1a1a2e',
  primary: '#16213e',
  secondary: '#0f3460',
  accent: '#e94560',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  success: '#28a745',
  warning: '#ffc107',
};

const { width } = Dimensions.get('window');

interface ProgressVisualizationProps {
  navigation: any;
  route: any;
}

interface PoolProgress {
  id: string;
  name: string;
  goal_cents: number;
  saved_cents: number;
  target_date?: string;
  milestones: Milestone[];
  recent_contributions: Contribution[];
}

interface Milestone {
  id: string;
  title: string;
  target_amount_cents: number;
  is_completed: boolean;
  order_index: number;
}

interface Contribution {
  id: string;
  amount_cents: number;
  created_at: string;
  user_name: string;
}

const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({ navigation, route }) => {
  const [poolProgress, setPoolProgress] = useState<PoolProgress | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');

  const poolId = route.params?.poolId || '1';

  useEffect(() => {
    loadProgressData();
  }, [timeframe]);

  const loadProgressData = async () => {
    try {
      // Mock progress data
      const mockProgress: PoolProgress = {
        id: poolId,
        name: 'Tokyo Trip 2024',
        goal_cents: 300000,
        saved_cents: 185000,
        target_date: '2024-06-15',
        milestones: [
          { id: '1', title: 'Flights', target_amount_cents: 120000, is_completed: true, order_index: 1 },
          { id: '2', title: 'Accommodation', target_amount_cents: 100000, is_completed: true, order_index: 2 },
          { id: '3', title: 'Activities', target_amount_cents: 50000, is_completed: false, order_index: 3 },
          { id: '4', title: 'Food & Dining', target_amount_cents: 30000, is_completed: false, order_index: 4 },
        ],
        recent_contributions: [
          { id: '1', amount_cents: 5000, created_at: '2024-01-20', user_name: 'You' },
          { id: '2', amount_cents: 7500, created_at: '2024-01-18', user_name: 'Sarah' },
          { id: '3', amount_cents: 10000, created_at: '2024-01-15', user_name: 'Mike' },
          { id: '4', amount_cents: 5000, created_at: '2024-01-12', user_name: 'You' },
          { id: '5', amount_cents: 2500, created_at: '2024-01-10', user_name: 'Sarah' },
        ],
      };
      setPoolProgress(mockProgress);
    } catch (error) {
      console.log('Load progress error:', error);
    }
  };

  const calculateProgress = () => {
    if (!poolProgress) return 0;
    return (poolProgress.saved_cents / poolProgress.goal_cents) * 100;
  };

  const getDaysRemaining = () => {
    if (!poolProgress?.target_date) return null;
    const target = new Date(poolProgress.target_date);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getWeeklyAverage = () => {
    if (!poolProgress) return 0;
    const contributions = poolProgress.recent_contributions;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyContributions = contributions.filter(c => 
      new Date(c.created_at) >= oneWeekAgo
    );
    
    const total = weeklyContributions.reduce((sum, c) => sum + c.amount_cents, 0);
    return total / 100;
  };

  const renderProgressBar = () => {
    const progress = calculateProgress();
    const progressWidth = (width - 40) * (progress / 100);

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>{progress.toFixed(1)}% Complete</Text>
      </View>
    );
  };

  const renderMilestoneProgress = () => {
    if (!poolProgress) return null;

    return (
      <View style={styles.milestonesContainer}>
        <Text style={styles.sectionTitle}>Milestone Progress</Text>
        {poolProgress.milestones.map((milestone, index) => {
          const isCompleted = milestone.is_completed;
          const progress = isCompleted ? 100 : 
            Math.min((poolProgress.saved_cents / milestone.target_amount_cents) * 100, 100);

          return (
            <View key={milestone.id} style={styles.milestoneItem}>
              <View style={styles.milestoneHeader}>
                <Text style={[styles.milestoneTitle, isCompleted && styles.completedText]}>
                  {milestone.title}
                </Text>
                <Text style={[styles.milestoneAmount, isCompleted && styles.completedText]}>
                  ${(milestone.target_amount_cents / 100).toLocaleString()}
                </Text>
              </View>
              <View style={styles.milestoneProgressBar}>
                <View 
                  style={[
                    styles.milestoneProgressFill, 
                    { width: `${progress}%` },
                    isCompleted && styles.completedFill
                  ]} 
                />
              </View>
              <Text style={styles.milestoneProgress}>{progress.toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderContributionChart = () => {
    if (!poolProgress) return null;

    const maxAmount = Math.max(...poolProgress.recent_contributions.map(c => c.amount_cents));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.timeframeSelector}>
          {(['week', 'month', 'all'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.timeframeButton, timeframe === period && styles.timeframeButtonActive]}
              onPress={() => setTimeframe(period)}
            >
              <Text style={[
                styles.timeframeButtonText,
                timeframe === period && styles.timeframeButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          <View style={styles.chart}>
            {poolProgress.recent_contributions.map((contribution, index) => {
              const height = (contribution.amount_cents / maxAmount) * 100;
              return (
                <View key={contribution.id} style={styles.chartBar}>
                  <View style={[styles.bar, { height }]} />
                  <Text style={styles.barAmount}>
                    ${(contribution.amount_cents / 100).toFixed(0)}
                  </Text>
                  <Text style={styles.barDate}>
                    {new Date(contribution.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Text style={styles.barUser}>{contribution.user_name}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (!poolProgress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  const progress = calculateProgress();
  const daysRemaining = getDaysRemaining();
  const weeklyAverage = getWeeklyAverage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Progress</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Main Progress */}
        <View style={styles.mainProgressCard}>
          <Text style={styles.poolName}>{poolProgress.name}</Text>
          <Text style={styles.goalAmount}>
            ${(poolProgress.saved_cents / 100).toLocaleString()} of ${(poolProgress.goal_cents / 100).toLocaleString()}
          </Text>
          {renderProgressBar()}
          
          <View style={styles.statsRow}>
            {daysRemaining !== null && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{daysRemaining}</Text>
                <Text style={styles.statLabel}>Days Left</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${weeklyAverage.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Weekly Avg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{poolProgress.milestones.filter(m => m.is_completed).length}</Text>
              <Text style={styles.statLabel}>Milestones</Text>
            </View>
          </View>
        </View>

        {renderMilestoneProgress()}
        {renderContributionChart()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  mainProgressCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  poolName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  goalAmount: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  milestonesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  milestoneItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  milestoneAmount: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  completedText: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  milestoneProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  completedFill: {
    backgroundColor: colors.success,
  },
  milestoneProgress: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  chartContainer: {
    marginBottom: 24,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: colors.accent,
  },
  timeframeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: 'white',
  },
  chartScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 40,
  },
  bar: {
    width: 24,
    backgroundColor: colors.accent,
    borderRadius: 12,
    minHeight: 20,
  },
  barAmount: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  barDate: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  barUser: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
});

export default ProgressVisualization;
