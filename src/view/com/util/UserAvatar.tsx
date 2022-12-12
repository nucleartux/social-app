import React, {useCallback} from 'react'
import {StyleSheet, View, TouchableOpacity, Alert, Image} from 'react-native'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  openCamera,
  openCropper,
  openPicker,
  Image as PickedImage,
} from 'react-native-image-crop-picker'
import {getGradient} from '../../lib/asset-gen'
import {colors} from '../../lib/styles'
import {register} from 'react-native-bundle-splitter'

export const UserAvatar = register(
  ({
    size,
    handle,
    avatar,
    displayName,
    onSelectNewAvatar,
  }: {
    size: number
    handle: string
    displayName: string | undefined
    avatar?: string | null
    onSelectNewAvatar?: (img: PickedImage) => void
  }) => {
    const initials = getInitials(displayName || handle)
    const gradient = getGradient(handle)

    const handleEditAvatar = useCallback(() => {
      Alert.alert('Select upload method', '', [
        {
          text: 'Take a new photo',
          onPress: () => {
            openCamera({
              mediaType: 'photo',
              cropping: true,
              width: 400,
              height: 400,
              cropperCircleOverlay: true,
              forceJpg: true, // ios only
              compressImageQuality: 0.7,
            }).then(onSelectNewAvatar)
          },
        },
        {
          text: 'Select from gallery',
          onPress: () => {
            openPicker({
              mediaType: 'photo',
            }).then(async item => {
              await openCropper({
                mediaType: 'photo',
                path: item.path,
                width: 400,
                height: 400,
                cropperCircleOverlay: true,
                forceJpg: true, // ios only
                compressImageQuality: 0.7,
              }).then(onSelectNewAvatar)
            })
          },
        },
      ])
    }, [onSelectNewAvatar])

    const renderSvg = (size: number, initials: string) => (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradient[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={gradient[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#grad)" />
        <Text
          fill="white"
          fontSize="50"
          fontWeight="bold"
          x="50"
          y="67"
          textAnchor="middle">
          {initials}
        </Text>
      </Svg>
    )

    // onSelectNewAvatar is only passed as prop on the EditProfile component
    return onSelectNewAvatar ? (
      <TouchableOpacity onPress={handleEditAvatar}>
        {avatar ? (
          <Image
            style={{width: size, height: size, borderRadius: (size / 2) | 0}}
            source={{uri: avatar}}
          />
        ) : (
          renderSvg(size, initials)
        )}
        <View style={styles.editButtonContainer}>
          <FontAwesomeIcon
            icon="camera"
            size={12}
            style={{color: colors.white}}
          />
        </View>
      </TouchableOpacity>
    ) : avatar ? (
      <Image
        style={{width: size, height: size, borderRadius: (size / 2) | 0}}
        resizeMode="stretch"
        source={{uri: avatar}}
      />
    ) : (
      renderSvg(size, initials)
    )
  },
)

function getInitials(str: string): string {
  const tokens = str
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split(' ')
    .filter(Boolean)
    .map(v => v.trim())
  if (tokens.length >= 2 && tokens[0][0] && tokens[0][1]) {
    return tokens[0][0].toUpperCase() + tokens[1][0].toUpperCase()
  }
  if (tokens.length === 1 && tokens[0][0]) {
    return tokens[0][0].toUpperCase()
  }
  return 'X'
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 0,
    right: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
})
