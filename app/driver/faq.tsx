import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { apiService } from '@/services/api';
import { BRAND } from '@/utils/colors';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  audience: string;
  order_index: number;
}

interface FAQCategory {
  [key: string]: FAQ[];
}

export default function DriverFAQScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme.mode === 'light';
  const params = useLocalSearchParams();
  const userRole = (params.role as string) || 'driver';

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [groupedFaqs, setGroupedFaqs] = useState<FAQCategory>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQs();
  }, [userRole]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/faqs?audience=${userRole}`);
      setFaqs((response as any).faqs || []);
      setGroupedFaqs((response as any).groupedByCategory || {});
      setCategories((response as any).categories || []);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const textColor = isLight ? '#000' : '#fff';
  const bgColor = isLight ? '#fff' : '#1a1a1a';
  const inputBg = isLight ? '#f5f5f5' : '#2a2a2a';
  const borderColor = isLight ? '#e0e0e0' : '#333';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>FAQ</Text>
        <TouchableOpacity
          onPress={() => router.push('/driver/help-and-support')}
          style={styles.supportButton}
        >
          <MaterialCommunityIcons name="headset" size={20} color={BRAND.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={isLight ? '#999' : '#666'} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search questions..."
              placeholderTextColor={isLight ? '#999' : '#666'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close" size={20} color={isLight ? '#999' : '#666'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            style={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && { backgroundColor: BRAND.primary },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryText, !selectedCategory && { color: '#000' }]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && { backgroundColor: BRAND.primary },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, selectedCategory === category && { color: '#000' }]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          <View style={styles.faqList}>
            {filteredFAQs.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="help-circle-outline" size={48} color={isLight ? '#ccc' : '#666'} />
                <Text style={[styles.emptyText, { color: isLight ? '#999' : '#666' }]}>
                  No FAQs found
                </Text>
              </View>
            ) : (
              filteredFAQs.map((faq) => (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => toggleExpand(faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqTitleContainer}>
                      <Text style={[styles.faqQuestion, { color: textColor }]}>{faq.question}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={expandedItems.has(faq.id) ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={isLight ? '#999' : '#666'}
                    />
                  </View>
                  {expandedItems.has(faq.id) && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={[styles.faqAnswer, { color: isLight ? '#333' : '#ccc' }]}>{faq.answer}</Text>
                      <TouchableOpacity
                        style={styles.supportLink}
                        onPress={() => router.push('/driver/help-and-support')}
                      >
                        <Text style={styles.supportLinkText}>Need more help? Contact support</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  supportButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoriesScroll: {
    marginTop: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.primary,
  },
  faqList: {
    padding: 16,
    paddingBottom: 100,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  supportLink: {
    marginTop: 12,
  },
  supportLinkText: {
    fontSize: 13,
    color: BRAND.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
