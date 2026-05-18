import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Check, ChevronDown, Tag } from 'lucide-react-native';
import { PickerModal } from './PickerModal';
import { BOOK_CATEGORIES, BookCategory, findCategoryByKey } from '../../constants/bookCategories';

interface CategoryPickerProps {
  /** Array of selected category keys. */
  selectedKeys: string[];
  /** Called when the user confirms or clears the selection. */
  onSelect: (keys: string[]) => void;
  /** Optional label shown above the trigger button. */
  label?: string;
}

/**
 * A reusable multi-select category picker component that displays a modal
 * with a scrollable, searchable list of book categories.
 *
 * Supports selecting multiple categories at once.
 *
 * @example
 * <CategoryPicker
 *   selectedKeys={categories}
 *   onSelect={(keys) => setCategories(keys)}
 * />
 */
export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedKeys,
  onSelect,
  label,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelection, setLocalSelection] = useState<string[]>(selectedKeys);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return BOOK_CATEGORIES;
    }
    const query = searchQuery.toLowerCase().trim();
    return BOOK_CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(query) ||
        cat.key.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleOpen = useCallback(() => {
    setSearchQuery('');
    setLocalSelection(selectedKeys);
    setIsVisible(true);
  }, [selectedKeys]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSearchQuery('');
  }, []);

  const handleToggle = useCallback((key: string) => {
    setLocalSelection((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(localSelection);
    handleClose();
  }, [localSelection, onSelect, handleClose]);

  const handleClear = useCallback(() => {
    setLocalSelection([]);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: BookCategory }) => {
      const isSelected = localSelection.includes(item.key);
      return (
        <TouchableOpacity
          style={[styles.item, isSelected && styles.itemSelected]}
          onPress={() => handleToggle(item.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.labelText, isSelected && styles.labelTextSelected]}>
            {item.label}
          </Text>
          {isSelected && <Check size={18} color="#b45309" strokeWidth={2.5} />}
        </TouchableOpacity>
      );
    },
    [localSelection, handleToggle]
  );

  const keyExtractor = useCallback((item: BookCategory) => item.key, []);

  const triggerText = useMemo(() => {
    if (selectedKeys.length === 0) {
      return 'Toutes les catégories';
    }
    if (selectedKeys.length === 1) {
      return findCategoryByKey(selectedKeys[0])?.label ?? selectedKeys[0];
    }
    return `${selectedKeys.length} catégories sélectionnées`;
  }, [selectedKeys]);

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Trigger button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.triggerContent}>
          <Tag size={16} color="#78716c" />
          <Text style={styles.triggerText} numberOfLines={1}>
            {triggerText}
          </Text>
        </View>
        <ChevronDown size={16} color="#78716c" />
      </TouchableOpacity>

      <PickerModal
        visible={isVisible}
        onClose={handleClose}
        title="Choisir des catégories"
        searchPlaceholder="Rechercher une catégorie..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        data={filteredCategories}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        emptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune catégorie trouvée.</Text>
          </View>
        }
        extraHeader={
          localSelection.length > 0 ? (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {localSelection.length} sélectionnée{localSelection.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={handleClear}>
                <Text style={styles.clearText}>Tout effacer</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
        footer={
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmButton, localSelection.length === 0 && styles.confirmButtonEmpty]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {localSelection.length > 0
                  ? `Valider (${localSelection.length})`
                  : 'Valider'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57534e',
    marginBottom: 6,
  },
  trigger: {
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  triggerText: {
    fontSize: 12,
    color: '#1c1917',
    fontWeight: '500',
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  itemSelected: {
    backgroundColor: '#fffbeb',
  },
  labelText: {
    flex: 1,
    fontSize: 13,
    color: '#44403c',
    fontWeight: '500',
  },
  labelTextSelected: {
    color: '#b45309',
    fontWeight: '700',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#a8a29e',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    backgroundColor: '#ffffff',
  },
  confirmButton: {
    backgroundColor: '#b45309',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonEmpty: {
    backgroundColor: '#d6d3d1',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
