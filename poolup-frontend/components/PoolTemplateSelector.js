import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

const radius = { sm: 8, md: 12, lg: 16 };

const defaultTemplates = [
  {
    id: 'vacation_beach',
    name: 'Beach Vacation',
    description: 'Save for your dream beach getaway',
    category: 'Travel',
    suggested_goal_cents: 300000,
    default_theme: 'beach_vacation',
    emoji: '🏖️',
    popularity_score: 95
  },
  {
    id: 'house_down_payment',
    name: 'House Down Payment',
    description: 'Build your future home fund',
    category: 'Real Estate',
    suggested_goal_cents: 5000000,
    default_theme: 'house_fund',
    emoji: '🏠',
    popularity_score: 88
  },
  {
    id: 'emergency_fund',
    name: 'Emergency Fund',
    description: '6 months of expenses for peace of mind',
    category: 'Financial Security',
    suggested_goal_cents: 1500000,
    default_theme: 'emergency_fund',
    emoji: '🛡️',
    popularity_score: 92
  },
  {
    id: 'concert_festival',
    name: 'Concert & Festival',
    description: 'Save for your favorite artists',
    category: 'Entertainment',
    suggested_goal_cents: 50000,
    default_theme: 'concert_tickets',
    emoji: '🎵',
    popularity_score: 76
  },
  {
    id: 'wedding_fund',
    name: 'Wedding Fund',
    description: 'Your special day deserves special savings',
    category: 'Life Events',
    suggested_goal_cents: 2500000,
    default_theme: 'roadmap_journey',
    emoji: '💒',
    popularity_score: 84
  },
  {
    id: 'car_purchase',
    name: 'Car Purchase',
    description: 'Save for your next vehicle',
    category: 'Transportation',
    suggested_goal_cents: 2000000,
    default_theme: 'roadmap_journey',
    emoji: '🚗',
    popularity_score: 79
  }
];

export default function PoolTemplateSelector({ 
  visible, 
  onClose, 
  onTemplateSelect,
  currentUser 
}) {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchTemplates();
      fetchCategories();
    }
  }, [visible]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/templates/templates');
      const data = await response.json();
      if (data.length > 0) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Use default templates as fallback
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/templates/categories');
      const data = await response.json();
      const categoryNames = ['All', ...data.map(cat => cat.category)];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(['All', 'Travel', 'Real Estate', 'Financial Security', 'Entertainment', 'Life Events']);
    }
  };

  const handleTemplateSelect = async (template) => {
    try {
      setLoading(true);
      
      Alert.alert(
        'Use Template',
        `Create a pool using "${template.name}" template?\n\nSuggested goal: $${(template.suggested_goal_cents / 100).toFixed(0)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Use Template', 
            onPress: () => {
              onTemplateSelect(template);
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Template selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const voteOnTemplate = async (templateId, voteType) => {
    try {
      await fetch(`http://localhost:3000/api/templates/templates/${templateId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          voteType
        })
      });
      
      // Refresh templates to show updated scores
      fetchTemplates();
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const renderTemplate = (template) => (
    <TouchableOpacity
      key={template.id}
      style={styles.templateCard}
      onPress={() => handleTemplateSelect(template)}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateEmoji}>{template.emoji}</Text>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateCategory}>{template.category}</Text>
        </View>
        <View style={styles.popularityContainer}>
          <Text style={styles.popularityScore}>⭐ {template.popularity_score || 0}</Text>
        </View>
      </View>
      
      <Text style={styles.templateDescription}>{template.description}</Text>
      
      <View style={styles.templateFooter}>
        <Text style={styles.suggestedGoal}>
          💰 ${(template.suggested_goal_cents / 100).toFixed(0)} suggested
        </Text>
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => voteOnTemplate(template.id, 'upvote')}
          >
            <Text style={styles.voteText}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => voteOnTemplate(template.id, 'downvote')}
          >
            <Text style={styles.voteText}>👎</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Pool Templates</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.activeCategoryTab
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.activeCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.templatesContainer}>
          {filteredTemplates.map(renderTemplate)}
          
          <TouchableOpacity
            style={styles.suggestButton}
            onPress={() => setShowSuggestForm(true)}
          >
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              style={styles.suggestGradient}
            >
              <Text style={styles.suggestButtonText}>💡 Suggest New Template</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <SuggestTemplateForm
          visible={showSuggestForm}
          onClose={() => setShowSuggestForm(false)}
          currentUser={currentUser}
          onSubmit={() => {
            setShowSuggestForm(false);
            Alert.alert('Thanks! 🙏', 'Your template suggestion has been submitted for review.');
          }}
        />
      </View>
    </Modal>
  );
}

function SuggestTemplateForm({ visible, onClose, currentUser, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Travel');
  const [suggestedGoal, setSuggestedGoal] = useState('');

  const submitSuggestion = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await fetch('http://localhost:3000/api/templates/templates/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          suggestedGoalCents: Math.round(parseFloat(suggestedGoal || 0) * 100),
          defaultTheme: 'beach_vacation',
          suggestedBy: currentUser.id
        })
      });
      
      setName('');
      setDescription('');
      setSuggestedGoal('');
      onSubmit();
    } catch (error) {
      console.error('Suggestion error:', error);
      Alert.alert('Error', 'Failed to submit suggestion');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>💡 Suggest Template</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.formContent}>
          <Text style={styles.fieldLabel}>Template Name *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Europe Backpacking Trip"
          />
          
          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe this savings goal..."
            multiline
          />
          
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Travel', 'Real Estate', 'Financial Security', 'Entertainment', 'Life Events', 'Education'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  category === cat && styles.selectedCategoryOption
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  category === cat && styles.selectedCategoryOptionText
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.fieldLabel}>Suggested Goal Amount</Text>
          <TextInput
            style={styles.textInput}
            value={suggestedGoal}
            onChangeText={setSuggestedGoal}
            placeholder="1000"
            keyboardType="numeric"
          />
        </ScrollView>
        
        <TouchableOpacity style={styles.submitButton} onPress={submitSuggestion}>
          <Text style={styles.submitButtonText}>📤 Submit Suggestion</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    padding: 4,
  },
  categoryContainer: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  activeCategoryTab: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activeCategoryText: {
    color: 'white',
  },
  templatesContainer: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  popularityContainer: {
    alignItems: 'center',
  },
  popularityScore: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestedGoal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  voteText: {
    fontSize: 16,
  },
  suggestButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  suggestGradient: {
    padding: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  suggestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedCategoryOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedCategoryOptionText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
