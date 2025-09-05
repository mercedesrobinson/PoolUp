import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
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

interface Notification {
  id: string;
  type: 'contribution' | 'milestone' | 'friend_request' | 'expense' | 'goal_reached';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  pool_id?: string;
  user_id?: string;
}

interface NotificationSettings {
  contributions: boolean;
  milestones: boolean;
  friend_requests: boolean;
  expenses: boolean;
  goal_updates: boolean;
  push_enabled: boolean;
}

interface NotificationsProps {
  navigation: any;
}

const Notifications: React.FC<NotificationsProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    contributions: true,
    milestones: true,
    friend_requests: true,
    expenses: true,
    goal_updates: true,
    push_enabled: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const loadNotifications = async () => {
    try {
      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'contribution',
          title: 'New Contribution',
          message: 'Sarah added $50 to Tokyo Trip 2024',
          created_at: '2024-01-20T10:30:00Z',
          is_read: false,
          pool_id: '1',
        },
        {
          id: '2',
          type: 'milestone',
          title: 'Milestone Completed!',
          message: 'Flight booking milestone reached for Tokyo Trip',
          created_at: '2024-01-19T15:45:00Z',
          is_read: false,
          pool_id: '1',
        },
        {
          id: '3',
          type: 'friend_request',
          title: 'Friend Request',
          message: 'Alex Chen sent you a friend request',
          created_at: '2024-01-18T09:15:00Z',
          is_read: true,
          user_id: '4',
        },
        {
          id: '4',
          type: 'expense',
          title: 'Expense Added',
          message: 'Mike added dinner expense: $85 split 3 ways',
          created_at: '2024-01-17T19:20:00Z',
          is_read: true,
          pool_id: '1',
        },
        {
          id: '5',
          type: 'goal_reached',
          title: 'Goal Achieved! 🎉',
          message: 'Emergency Fund reached 100% of target!',
          created_at: '2024-01-15T12:00:00Z',
          is_read: true,
          pool_id: '2',
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.log('Load notifications error:', error);
    }
  };

  const loadSettings = async () => {
    try {
      // Load from local storage or API
      // For now using default settings
    } catch (error) {
      console.log('Load settings error:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.log('Mark as read error:', error);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => setNotifications([])
        },
      ]
    );
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Save to storage/API
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'contribution': return '💰';
      case 'milestone': return '🎯';
      case 'friend_request': return '👥';
      case 'expense': return '🧾';
      case 'goal_reached': return '🎉';
      default: return '📱';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </Text>
          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
          </View>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Notification Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Push Notifications</Text>
        <Switch
          value={settings.push_enabled}
          onValueChange={(value) => updateSetting('push_enabled', value)}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.accent }}
          thumbColor="white"
        />
      </View>

      <View style={styles.settingsDivider} />

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Contributions</Text>
        <Switch
          value={settings.contributions}
          onValueChange={(value) => updateSetting('contributions', value)}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.accent }}
          thumbColor="white"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Milestones</Text>
        <Switch
          value={settings.milestones}
          onValueChange={(value) => updateSetting('milestones', value)}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.accent }}
          thumbColor="white"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Friend Requests</Text>
        <Switch
          value={settings.friend_requests}
          onValueChange={(value) => updateSetting('friend_requests', value)}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.accent }}
          thumbColor="white"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Expenses</Text>
        <Switch
          value={settings.expenses}
          onValueChange={(value) => updateSetting('expenses', value)}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.accent }}
          thumbColor="white"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Goal Updates</Text>
        <Switch
          value={settings.goal_updates}
          onValueChange={(value) => updateSetting('goal_updates', value)}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.accent }}
          thumbColor="white"
        />
      </View>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {showSettings ? (
        renderSettings()
      ) : (
        <View style={styles.content}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
              }}
            >
              <Text style={styles.actionButtonText}>Mark All Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={clearAllNotifications}
            >
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                  You'll see updates about contributions, milestones, and more here
                </Text>
              </View>
            }
          />
        </View>
      )}
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
  settingsButton: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  notificationContent: {
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadTitle: {
    color: colors.accent,
  },
  notificationMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
});

export default Notifications;
