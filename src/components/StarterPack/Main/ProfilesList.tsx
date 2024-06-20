import React, {useCallback} from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {AppBskyActorDefs, AtUri, ModerationOpts} from '@atproto/api'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {isNative, isWeb} from 'platform/detection'
import {useListMembersQuery} from 'state/queries/list-members'
import {useSession} from 'state/session'
import {List, ListRef} from 'view/com/util/List'
import {SectionRef} from '#/screens/Profile/Sections/types'
import {atoms as a, useTheme} from '#/alf'
import {Default as ProfileCard} from '#/components/ProfileCard'

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic, index: number) {
  return `${item.did}-${index}`
}

interface ProfilesListProps {
  listUri: string
  headerHeight: number
  scrollElRef: ListRef
  moderationOpts: ModerationOpts
}

export const ProfilesList = React.forwardRef<SectionRef, ProfilesListProps>(
  function ProfilesListImpl(
    {listUri, headerHeight, scrollElRef, moderationOpts},
    ref,
  ) {
    const t = useTheme()
    const [initialHeaderHeight] = React.useState(headerHeight)
    const bottomBarOffset = useBottomBarOffset(20)
    const {currentAccount} = useSession()

    const [isPTRing, setIsPTRing] = React.useState(false)
    const {data, refetch} = useListMembersQuery(listUri, 50)

    // The server returns these sorted by descending creation date, so we want to invert
    const profiles = data?.pages
      .flatMap(p => p.items.map(i => i.subject))
      .reverse()
    const isOwn = new AtUri(listUri).host === currentAccount?.did

    const getSortedProfiles = () => {
      if (!profiles) return
      if (!isOwn) return profiles

      const myIndex = profiles.findIndex(p => p.did === currentAccount?.did)
      return myIndex !== -1
        ? [
            profiles[myIndex],
            ...profiles.slice(0, myIndex),
            ...profiles.slice(myIndex + 1),
          ]
        : profiles
    }
    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
    }, [scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderItem = ({
      item,
      index,
    }: ListRenderItemInfo<AppBskyActorDefs.ProfileViewBasic>) => {
      return (
        <View
          style={[
            a.p_lg,
            t.atoms.border_contrast_low,
            (isWeb || index !== 0) && a.border_t,
          ]}>
          <ProfileCard
            profile={item}
            moderationOpts={moderationOpts}
            logContext="StarterPackProfilesList"
          />
        </View>
      )
    }

    return (
      <List
        data={getSortedProfiles()}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ref={scrollElRef}
        headerOffset={headerHeight}
        ListFooterComponent={
          <View style={[{height: initialHeaderHeight + bottomBarOffset}]} />
        }
        showsVerticalScrollIndicator={false}
        desktopFixedHeight
        refreshing={isPTRing}
        onRefresh={async () => {
          setIsPTRing(true)
          await refetch()
          setIsPTRing(false)
        }}
      />
    )
  },
)
