import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';

const colors = {
  background: '#1a1a2e',
  primary: '#16213e',
  secondary: '#0f3460',
  accent: '#e94560',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
};
import { Milestone, MilestoneTemplate } from '../types';

interface MilestonesProps {
  navigation: any;
  route: any;
}

const Milestones: React.FC<MilestonesProps> = ({ navigation, route }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: '',
  });

  const poolId = route.params?.poolId;
  const goalAmount = route.params?.goalAmount || 40000;
  const category = route.params?.category || 'house';

  const milestoneTemplates: Record<string, MilestoneTemplate[]> = {
    house: [
      { id: '1', category: 'house', title: 'Down Payment', description: '20% down payment', percentage_of_goal: 50, order_index: 1 },
      { id: '2', category: 'house', title: 'Closing Costs', description: 'Legal fees, inspections, etc.', percentage_of_goal: 7.5, order_index: 2 },
      { id: '3', category: 'house', title: 'Moving Expenses', description: 'Movers, utilities setup', percentage_of_goal: 5, order_index: 3 },
      { id: '4', category: 'house', title: 'Emergency Fund', description: 'Home maintenance buffer', percentage_of_goal: 12.5, order_index: 4 },
      { id: '5', category: 'house', title: 'Initial Renovations', description: 'Immediate improvements', percentage_of_goal: 25, order_index: 5 },
    ],
    wedding: [
      { id: '1', category: 'wedding', title: 'Venue & Catering', description: 'Reception location and food', percentage_of_goal: 45, order_index: 1 },
      { id: '2', category: 'wedding', title: 'Photography', description: 'Professional wedding photos', percentage_of_goal: 15, order_index: 2 },
      { id: '3', category: 'wedding', title: 'Attire & Beauty', description: 'Dress, suit, hair, makeup', percentage_of_goal: 12, order_index: 3 },
      { id: '4', category: 'wedding', title: 'Flowers & Decor', description: 'Bouquet, centerpieces, decorations', percentage_of_goal: 10, order_index: 4 },
      { id: '5', category: 'wedding', title: 'Music & Entertainment', description: 'DJ, band, or entertainment', percentage_of_goal: 8, order_index: 5 },
      { id: '6', category: 'wedding', title: 'Honeymoon Fund', description: 'Post-wedding celebration', percentage_of_goal: 10, order_index: 6 },
    ],
    car: [
      { id: '1', category: 'car', title: 'Down Payment', description: 'Initial payment for vehicle', percentage_of_goal: 60, order_index: 1 },
      { id: '2', category: 'car', title: 'Insurance', description: 'First year insurance premium', percentage_of_goal: 15, order_index: 2 },
      { id: '3', category: 'car', title: 'Registration & Fees', description: 'DMV and dealer fees', percentage_of_goal: 5, order_index: 3 },
      { id: '4', category: 'car', title: 'Maintenance Fund', description: 'Repairs and upkeep buffer', percentage_of_goal: 20, order_index: 4 },
    ],
    vacation: [
      { id: '1', category: 'vacation', title: 'Flights', description: 'Round-trip airfare', percentage_of_goal: 35, order_index: 1 },
      { id: '2', category: 'vacation', title: 'Accommodation', description: 'Hotel or rental stay', percentage_of_goal: 30, order_index: 2 },
      { id: '3', category: 'vacation', title: 'Activities & Tours', description: 'Excursions and experiences', percentage_of_goal: 20, order_index: 3 },
      { id: '4', category: 'vacation', title: 'Food & Dining', description: 'Meals and local cuisine', percentage_of_goal: 10, order_index: 4 },
      { id: '5', category: 'vacation', title: 'Shopping & Souvenirs', description: 'Gifts and mementos', percentage_of_goal: 5, order_index: 5 },
    ],
    emergency: [
      { id: '1', category: 'emergency', title: 'Month 1-2 Expenses', description: 'First 2 months of living costs', percentage_of_goal: 33, order_index: 1 },
      { id: '2', category: 'emergency', title: 'Month 3-4 Expenses', description: 'Additional 2 months buffer', percentage_of_goal: 33, order_index: 2 },
      { id: '3', category: 'emergency', title: 'Month 5-6 Expenses', description: 'Full 6-month emergency fund', percentage_of_goal: 34, order_index: 3 },
    ],
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    try {
      const response = await api.getPoolMilestones(poolId);
      setMilestones(response.data || []);
    } catch (error) {
      console.log('Load milestones error:', error);
      // Mock milestones based on category
      const templates = milestoneTemplates[category] || [];
      const mockMilestones = templates.map((template, index) => ({
        id: `milestone_${index + 1}`,
        pool_id: poolId,
        title: template.title,
        description: template.description,
        target_amount_cents: Math.round((goalAmount * template.percentage_of_goal) / 100 * 100),
        order_index: template.order_index,
        is_completed: index === 0, // First milestone completed
        completed_at: index === 0 ? '2024-01-15' : undefined,
        created_at: '2024-01-01',
      }));
      setMilestones(mockMilestones);
    }
  };

  const addCustomMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const milestone = {
        pool_id: poolId,
        title: newMilestone.title,
        description: newMilestone.description,
        target_amount_cents: Math.round(parseFloat(newMilestone.amount) * 100),
        order_index: milestones.length + 1,
      };

      await api.createMilestone(milestone);
      loadMilestones();
      setShowAddModal(false);
      setNewMilestone({ title: '', description: '', amount: '' });
      Alert.alert('Success', 'Milestone added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add milestone');
    }
  };

  const useTemplate = (template: MilestoneTemplate) => {
    const amount = Math.round((goalAmount * template.percentage_of_goal) / 100);
    setNewMilestone({
      title: template.title,
      description: template.description,
      amount: amount.toString(),
    });
    setShowTemplateModal(false);
    setShowAddModal(true);
  };

  const toggleMilestoneComplete = async (milestoneId: string, isCompleted: boolean) => {
    try {
      await api.updateMilestone(milestoneId, { is_completed: !isCompleted });
      loadMilestones();
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const renderMilestone = ({ item, index }: { item: Milestone; index: number }) => {
    const amountDollars = item.target_amount_cents / 100;
    const isNext = !item.is_completed && index === milestones.findIndex(m => !m.is_completed);

    return (
      <View style={[
        styles.milestoneCard,
        item.is_completed && styles.completedCard,
        isNext && styles.nextCard
      ]}>
        <View style={styles.milestoneHeader}>
          <TouchableOpacity
            style={[styles.checkbox, item.is_completed && styles.checkedBox]}
            onPress={() => toggleMilestoneComplete(item.id, item.is_completed)}
          >
            {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.milestoneInfo}>
            <Text style={[styles.milestoneTitle, item.is_completed && styles.completedText]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.milestoneDescription, item.is_completed && styles.completedText]}>
                {item.description}
              </Text>
            )}
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.milestoneAmount, item.is_completed && styles.completedText]}>
              ${amountDollars.toLocaleString()}
            </Text>
            {isNext && (
              <Text style={styles.nextLabel}>NEXT</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTemplateItem = ({ item }: { item: MilestoneTemplate }) => {
    const amount = Math.round((goalAmount * item.percentage_of_goal) / 100);
    
    return (
      <TouchableOpacity
        style={styles.templateCard}
        onPress={() => useTemplate(item)}
      >
        <Text style={styles.templateTitle}>{item.title}</Text>
        <Text style={styles.templateDescription}>{item.description}</Text>
        <Text style={styles.templateAmount}>${amount.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  const totalCompleted = milestones.filter(m => m.is_completed).length;
  const totalAmount = milestones.reduce((sum, m) => sum + m.target_amount_cents, 0) / 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Milestones</Text>
        <TouchableOpacity onPress={() => setShowTemplateModal(true)}>
          <Text style={styles.templatesButton}>Templates</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <Text style={styles.progressTitle}>Your Roadmap Progress</Text>
        <Text style={styles.progressStats}>
          {totalCompleted} of {milestones.length} milestones completed
        </Text>
        <Text style={styles.progressAmount}>
          Total: ${totalAmount.toLocaleString()}
        </Text>
      </View>

      {/* Milestones List */}
      <FlatList
        data={milestones}
        renderItem={renderMilestone}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No milestones yet</Text>
            <Text style={styles.emptySubtext}>
              Break down your goal into smaller, achievable milestones
            </Text>
          </View>
        }
      />

      {/* Add Milestone Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Custom Milestone</Text>
      </TouchableOpacity>

      {/* Add Milestone Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Milestone</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Milestone title"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newMilestone.title}
              onChangeText={(text) => setNewMilestone({...newMilestone, title: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newMilestone.description}
              onChangeText={(text) => setNewMilestone({...newMilestone, description: text})}
              multiline
            />
            
            <TextInput
              style={styles.input}
              placeholder="Target amount ($)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newMilestone.amount}
              onChangeText={(text) => setNewMilestone({...newMilestone, amount: text})}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewMilestone({ title: '', description: '', amount: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addCustomMilestone}
              >
                <Text style={styles.saveButtonText}>Add Milestone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Template Modal */}
      <Modal visible={showTemplateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.templateModalContent}>
            <View style={styles.templateHeader}>
              <Text style={styles.modalTitle}>Milestone Templates</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {Object.entries(milestoneTemplates).map(([categoryKey, templates]) => (
                <View key={categoryKey} style={styles.templateCategory}>
                  <Text style={styles.categoryTitle}>
                    {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
                  </Text>
                  <FlatList
                    data={templates}
                    renderItem={renderTemplateItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  templatesButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  progressTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressStats: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  progressAmount: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  completedCard: {
    backgroundColor: 'rgba(0,255,0,0.1)',
  },
  nextCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  completedText: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  milestoneAmount: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  templateModalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 24,
  },
  templateCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  templateCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  templateTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 6,
  },
  templateAmount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Milestones;
