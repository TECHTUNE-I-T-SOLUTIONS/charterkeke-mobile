import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, Animated, Share, AccessibilityInfo } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { BRAND } from '@/utils/colors'

const { width } = Dimensions.get('window')
const CARD_WIDTH = Math.min(340, width - 40)

export type CtaCard = {
  id: string
  title: string
  subtitle?: string
  label?: string
  image?: any
  onPress?: () => void
  share?: boolean
}

export default function CtaCarousel({ items }: { items: CtaCard[] }) {
  const { theme } = useTheme()
  const scrollX = useRef(new Animated.Value(0)).current
  const scrollRef = useRef<ScrollView | null>(null)
  const appLink = process.env.EXPO_PUBLIC_APP_LINK || process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.example.com'

  useEffect(() => {
    // optional: autoplay
    let idx = 0
    const handle = setInterval(() => {
      if (!items || items.length <= 1 || !scrollRef.current) return
      idx = (idx + 1) % items.length
      scrollRef.current.scrollTo({ x: idx * CARD_WIDTH, animated: true })
    }, 6000)
    return () => clearInterval(handle)
  }, [items])

  const onShare = async (message: string) => {
    try {
      const shareMessage = `${message}\n\nGet the app: ${appLink}`
      await Share.share({ message: shareMessage })
    } catch (err) {
      console.warn('Share failed', err)
    }
  }

  return (
    <View style={styles.container}>
      <View>
      <ScrollView
        ref={(r) => (scrollRef.current = r)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        accessibilityRole="scrollbar"
        accessibilityLabel="Promotional cards carousel"
      >
        {items.map((it, index) => (
          <View key={it.id} style={[styles.card, { width: CARD_WIDTH, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.cardInner}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{it.title}</Text>
                {it.subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{it.subtitle}</Text> : null}
                <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => it.onPress && it.onPress()}
                    style={[styles.ctaBtn, { backgroundColor: BRAND.primary }] }
                    accessibilityRole="button"
                    accessibilityLabel={`${it.label || 'Open'} - ${it.title}`}
                  >
                    <Text style={styles.ctaText}>{it.label || 'Open'}</Text>
                  </TouchableOpacity>
                  {it.share ? (
                    <TouchableOpacity
                      onPress={() => onShare(it.subtitle || `Check out ${appLink}`)}
                      style={[styles.ctaBtn, { backgroundColor: theme.colors.card }] }
                      accessibilityRole="button"
                      accessibilityLabel={`Share ${it.title}`}
                    >
                      <Text style={[styles.ctaText, { color: theme.colors.textPrimary }]}>Share</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              {it.image ? <Image source={it.image} style={styles.image} resizeMode="contain" /> : null}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dotsWrap} pointerEvents="none">
        {items.map((_, i) => {
          const inputRange = [ (i - 1) * CARD_WIDTH, i * CARD_WIDTH, (i + 1) * CARD_WIDTH ]
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' })
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1.15, 0.9], extrapolate: 'clamp' })
          return (
            <Animated.View key={`dot-${i}`} style={[styles.dot, { opacity, transform: [{ scale }] }]} />
          )
        })}
      </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  card: {
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13, opacity: 0.9 },
  ctaBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  ctaText: { fontWeight: '700', color: '#000' },
  image: { width: 72, height: 72, marginLeft: 12 },
  dotsWrap: { position: 'absolute', left: 0, right: 0, bottom: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#FFF', marginHorizontal: 4, opacity: 0.5 },
})
