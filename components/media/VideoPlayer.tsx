import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-video';
import { COLORS } from '@/utils/colors';

interface VideoPlayerProps {
  source: string | number | { uri: string };
  title?: string;
  description?: string;
  onClose?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export default function VideoPlayer({
  source,
  title,
  description,
  onClose,
  autoPlay = true,
  loop = false,
  controls = true,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadComplete = (data: any) => {
    setIsLoading(false);
    setDuration(data.duration);
  };

  const handleStatusUpdate = (status: any) => {
    if (status.isLoaded && !status.isBuffering) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.didJustFinish && !loop) {
        setIsPlaying(false);
      }
    }
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    Alert.alert('Video Error', 'Failed to load video');
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={source}
          onLoadStart={handleLoadStart}
          onLoad={handleLoadComplete}
          onStatusUpdate={handleStatusUpdate}
          onError={handleError}
          shouldPlay={isPlaying}
          isLooping={loop}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          style={styles.video}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.light.primary} />
          </View>
        )}

        {/* Play/Pause Overlay */}
        {!controls && (
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={handlePlayPause}
          >
            <Text style={styles.playPauseIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Close Button */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      {(title || description) && (
        <View style={styles.infoContainer}>
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      )}

      {/* Controls */}
      {controls && (
        <View style={styles.controlsContainer}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePlayPause}
          >
            <Text style={styles.controlIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>

          {/* Time */}
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>

          {/* Volume Controls (placeholder) */}
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.light.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    backgroundColor: '#000000',
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playPauseButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    fontSize: 48,
    color: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.light.textSecondary,
    lineHeight: 18,
  },
  controlsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.light.primary,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.light.textSecondary,
  },
});
