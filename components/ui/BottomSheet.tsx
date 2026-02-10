import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '@/utils/colors';

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  isDark?: boolean;
  height?: number;
}

const BottomSheet = ({
  visible,
  title,
  onClose,
  children,
  isDark = false,
  height = 400,
}: BottomSheetProps) => {
  const [slideAnimation] = useState(new Animated.Value(0));
  const colors = isDark ? COLORS.dark : COLORS.light;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#00000060',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            minHeight: height,
            transform: [{ translateY }],
            paddingTop: 0,
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Handle */}
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.border,
                  borderRadius: 2,
                }}
              />
            </View>

            {/* Header */}
            {title && (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: colors.text,
                  }}
                >
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={{ fontSize: 24, color: colors.textSecondary }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Content */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                flex: 1,
              }}
            >
              {children}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BottomSheet;
