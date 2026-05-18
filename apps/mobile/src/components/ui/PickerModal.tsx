import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  ListRenderItem,
} from 'react-native';
import { X, Search } from 'lucide-react-native';

interface PickerModalProps<T> {
  /** Controls modal visibility. */
  visible: boolean;
  /** Called when the user requests to close the modal. */
  onClose: () => void;
  /** Title shown in the modal header. */
  title: string;
  /** Placeholder text for the search input. */
  searchPlaceholder: string;
  /** Current search query. */
  searchQuery: string;
  /** Called when the search query changes. */
  onSearchChange: (query: string) => void;
  /** Data array to render in the list. */
  data: T[];
  /** Unique key extractor for list items. */
  keyExtractor: (item: T) => string;
  /** Render function for each list item. */
  renderItem: ListRenderItem<T>;
  /** Optional component rendered above the list (e.g., selection count bar). */
  extraHeader?: React.ReactNode;
  /** Optional component rendered below the list (e.g., confirm button). */
  footer?: React.ReactNode;
  /** Component rendered when the data array is empty. */
  emptyComponent: React.ReactElement | null;
}

/**
 * Reusable modal shell for picker components.
 * Provides overlay, header, search bar, scrollable list, and optional footer.
 *
 * @template T The type of items in the data array.
 */
export function PickerModal<T>({
  visible,
  onClose,
  title,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  data,
  keyExtractor,
  renderItem,
  extraHeader,
  footer,
  emptyComponent,
}: PickerModalProps<T>) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>{title}</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={22} color="#44403c" />
                  </TouchableOpacity>
                </View>

                {/* Extra header slot */}
                {extraHeader}

                {/* Search bar */}
                <View style={styles.searchContainer}>
                  <Search size={16} color="#a8a29e" style={styles.searchIcon} />
                  <RNTextInput
                    style={styles.searchInput}
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#a8a29e"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => onSearchChange('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color="#a8a29e" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* List */}
                <FlatList
                  data={data}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={emptyComponent}
                  contentContainerStyle={styles.listContent}
                />

                {/* Footer slot */}
                {footer}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '62%',
    marginBottom: 36,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f4',
    borderRadius: 10,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1c1917',
    paddingVertical: 4,
  },
  listContent: {
    paddingBottom: 28,
  },
});
