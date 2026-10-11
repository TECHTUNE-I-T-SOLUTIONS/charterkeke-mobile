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

export default function FAQScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme.mode === 'light';
  const params = useLocalSearchParams();
  const userRole = (params.role as string) || 'rider';

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

  const filteredFaqs = selectedCategory
    ? groupedFaqs[selectedCategory] || []
    : faqs;

  const searchedFaqs = searchQuery
    ? filteredFaqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredFaqs;

  const categoriesToShow = searchQuery
    ? [...new Set(searchedFaqs.map((faq) => faq.category))]
    : categories;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>FAQ</Text>
        <TouchableOpacity onPress={() => router.push('/rider/help-and-support')} style={styles.backBtn}>
          <MaterialCommunityIcons name="headset" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          placeholder="Search FAQs..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* FAQ List - Single ScrollView with categories and FAQs */}
      <ScrollView style={styles.faqList} contentContainerStyle={styles.faqListContent}>
        {/* Category Filter */}
        {!searchQuery && (
          <View style={styles.categorySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === null
                    ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                    : { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === null ? '#000' : theme.colors.textSecondary },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category
                      ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                      : { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selectedCategory === category ? '#000' : theme.colors.textSecondary },
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {searchedFaqs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="help-circle-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'No FAQs match your search' : 'No FAQs available'}
            </Text>
          </View>
        ) : (
          <>
            {categoriesToShow.map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: theme.colors.textPrimary }]}>{category}</Text>
                {(selectedCategory ? groupedFaqs[category] : faqs)
                  .filter((faq) => !searchQuery || searchedFaqs.includes(faq))
                  .map((faq) => (
                    <TouchableOpacity
                      key={faq.id}
                      style={[styles.faqItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                      onPress={() => toggleExpand(faq.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqHeader}>
                        <Text style={[styles.faqQuestion, { color: theme.colors.textPrimary }]}>{faq.question}</Text>
                        <MaterialCommunityIcons
                          name={expandedItems.has(faq.id) ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      {expandedItems.has(faq.id) && (
                        <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>{faq.answer}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 14,
  },
  categoryContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  faqList: {
    flex: 1,
  },
  faqListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
});
