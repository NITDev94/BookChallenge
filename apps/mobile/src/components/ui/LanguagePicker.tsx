import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { PickerModal } from './PickerModal';
import { LANGUAGE_OPTIONS, LanguageOption, findLanguageByCode } from '../../constants/languages';

interface LanguagePickerProps {
  /** Currently selected language code, or null/empty for "any language". */
  selectedCode: string | null;
  /** Called when the user selects or deselects a language. */
  onSelect: (code: string | null) => void;
  /** Optional label shown above the trigger button. */
  label?: string;
}

/**
 * A reusable language picker component that displays a modal with a
 * scrollable, searchable list of languages shown with flag emojis.
 *
 * @example
 * <LanguagePicker
 *   selectedCode={language}
 *   onSelect={(code) => setLanguage(code ?? '')}
 * />
 */
export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  selectedCode,
  onSelect,
  label,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLanguage = useMemo(
    () => (selectedCode ? findLanguageByCode(selectedCode) : undefined),
    [selectedCode]
  );

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) {
      return LANGUAGE_OPTIONS;
    }
    const query = searchQuery.toLowerCase().trim();
    return LANGUAGE_OPTIONS.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleOpen = useCallback(() => {
    setSearchQuery('');
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      if (selectedCode === code) {
        // Deselect if tapping the already selected language
        onSelect(null);
      } else {
        onSelect(code);
      }
      handleClose();
    },
    [selectedCode, onSelect, handleClose]
  );

  const renderItem = useCallback(
    ({ item }: { item: LanguageOption }) => {
      const isSelected = selectedCode === item.code;
      return (
        <TouchableOpacity
          style={[styles.item, isSelected && styles.itemSelected]}
          onPress={() => handleSelect(item.code)}
          activeOpacity={0.7}
        >
          <Text style={styles.flag}>{item.flag}</Text>
          <Text style={[styles.name, isSelected && styles.nameSelected]}>
            {item.name}
          </Text>
          {isSelected && <Check size={18} color="#b45309" strokeWidth={2.5} />}
        </TouchableOpacity>
      );
    },
    [selectedCode, handleSelect]
  );

  const keyExtractor = useCallback((item: LanguageOption) => item.code, []);

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
          <Text style={styles.triggerFlag}>
            {selectedLanguage ? selectedLanguage.flag : '🌐'}
          </Text>
          <Text style={styles.triggerText}>
            {selectedLanguage ? selectedLanguage.name : 'Toute langue'}
          </Text>
        </View>
        <ChevronDown size={16} color="#78716c" />
      </TouchableOpacity>

      <PickerModal
        visible={isVisible}
        onClose={handleClose}
        title="Choisir une langue"
        searchPlaceholder="Rechercher une langue..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        data={filteredLanguages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        emptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune langue trouvée.</Text>
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
  },
  triggerFlag: {
    fontSize: 18,
  },
  triggerText: {
    fontSize: 12,
    color: '#1c1917',
    fontWeight: '500',
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
  flag: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: '#44403c',
    fontWeight: '500',
  },
  nameSelected: {
    color: '#b45309',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#a8a29e',
  },
});
