import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Trophy, Gift } from 'lucide-react-native';
import { RootState } from '../store';
import { useChallenges } from '../hooks/useChallenges';
import { ChallengeSection } from '../components/challenges/ChallengeSection';
import { ChallengeProgressCard } from '../components/challenges/ChallengeProgressCard';
import { RewardUnlockCard } from '../components/challenges/RewardUnlockCard';
import { commonStyles } from '../theme';
import { CreateCustomChallengeInput } from '../types/challenges';
import { LanguagePicker } from '../components/ui/LanguagePicker';
import { CategoryPicker } from '../components/ui/CategoryPicker';

const GOAL_OPTIONS: Array<{ value: CreateCustomChallengeInput['goalKind']; label: string }> = [
  { value: 'books_completed', label: 'Livres terminés' },
  { value: 'pages_read', label: 'Pages lues' },
  { value: 'reading_streak', label: 'Jours de série' },
  { value: 'books_started', label: 'Livres commencés' },
];

export const ChallengesScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    activeChallenges,
    completedChallenges,
    failedChallenges,
    archivedChallenges,
    availableChallenges,
    joinChallenge,
    createChallenge,
    isCreatingChallenge,
    joiningTemplateIds,
    rewards,
    isLoading,
  } = useChallenges(user?.uid);

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [goalKind, setGoalKind] = useState<CreateCustomChallengeInput['goalKind']>('books_completed');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('1');
  const [language, setLanguage] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [durationDaysInput, setDurationDaysInput] = useState('30');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const handleJoinChallenge = async (templateId: string) => {
    await joinChallenge(templateId);
  };

  const handleCreateChallenge = async () => {
    setCreateError(null);
    setCreateSuccess(null);

    const normalizedTarget = Math.max(1, Math.floor(Number(target) || 0));
    const normalizedDuration = Math.max(0, Math.floor(Number(durationDaysInput) || 0));

    if (title.trim().length < 3) {
      setCreateError('Le titre doit contenir au moins 3 caractères.');
      return;
    }

    if (description.trim().length < 8) {
      setCreateError('La description doit contenir au moins 8 caractères.');
      return;
    }

    if (!Number.isFinite(normalizedTarget) || normalizedTarget < 1) {
      setCreateError('La cible doit être un nombre supérieur ou égal à 1.');
      return;
    }

    const categoriesAny = selectedCategories.map((key) => key.toLowerCase());

    const created = await createChallenge({
      title,
      description,
      goalKind,
      target: normalizedTarget,
      language: language.trim().length > 0 ? language.trim().toLowerCase() : undefined,
      categoriesAny: categoriesAny.length > 0 ? categoriesAny : undefined,
      durationDays: normalizedDuration > 0 ? normalizedDuration : undefined,
    });

    if (!created) {
      setCreateError('Impossible de créer le challenge pour le moment.');
      return;
    }

    setCreateSuccess('Challenge créé avec succès.');
    setTitle('');
    setDescription('');
    setTarget('1');
    setLanguage('');
    setSelectedCategories([]);
    setDurationDaysInput('30');
    setGoalKind('books_completed');
    setIsCreateFormOpen(false);
  };

  const supportsBookFilters = goalKind === 'books_completed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>
          Suivez votre progression et débloquez vos rewards automatiquement.
        </Text>

        <ChallengeSection title="Créer un challenge">
          {!isCreateFormOpen ? (
            <TouchableOpacity
              style={styles.createCtaButton}
              onPress={() => {
                setCreateError(null);
                setCreateSuccess(null);
                setIsCreateFormOpen(true);
              }}
            >
              <Text style={styles.createCtaText}>Créer un challenge personnalisé</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.createCard}>
              <Text style={styles.createCardTitle}>Nouveau challenge</Text>

              <Text style={styles.inputLabel}>Titre</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Marathon Histoire"
                placeholderTextColor="#a8a29e"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez l'objectif en une phrase"
                placeholderTextColor="#a8a29e"
                multiline
                style={[styles.input, styles.multilineInput]}
              />

              <Text style={styles.inputLabel}>Objectif</Text>
              <View style={styles.goalOptionsRow}>
                {GOAL_OPTIONS.map((option) => {
                  const selected = goalKind === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.goalChip, selected && styles.goalChipSelected]}
                      onPress={() => setGoalKind(option.value)}
                    >
                      <Text style={[styles.goalChipText, selected && styles.goalChipTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Cible</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                placeholder="1"
                placeholderTextColor="#a8a29e"
                keyboardType="number-pad"
                style={styles.input}
              />

              {supportsBookFilters && (
                <>
                  <LanguagePicker
                    selectedCode={language || null}
                    onSelect={(code) => setLanguage(code ?? '')}
                    label="Langue (optionnel)"
                  />

                  <CategoryPicker
                    selectedKeys={selectedCategories}
                    onSelect={(keys) => setSelectedCategories(keys)}
                    label="Catégories (optionnel)"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Durée en jours (0 = illimité)</Text>
              <TextInput
                value={durationDaysInput}
                onChangeText={setDurationDaysInput}
                placeholder="30"
                placeholderTextColor="#a8a29e"
                keyboardType="number-pad"
                style={styles.input}
              />

              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              {createSuccess ? <Text style={styles.successText}>{createSuccess}</Text> : null}

              <View style={styles.createActionsRow}>
                <TouchableOpacity
                  style={[styles.createActionButton, styles.cancelButton]}
                  onPress={() => {
                    setIsCreateFormOpen(false);
                    setCreateError(null);
                  }}
                  disabled={isCreatingChallenge}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createActionButton, styles.submitButton, isCreatingChallenge && styles.submitButtonDisabled]}
                  onPress={handleCreateChallenge}
                  disabled={isCreatingChallenge}
                >
                  {isCreatingChallenge ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ChallengeSection>

        <ChallengeSection title="Disponibles" count={availableChallenges.length}>
          {isLoading ? (
            <View style={styles.skeleton} />
          ) : availableChallenges.length === 0 ? (
            <Text style={styles.muted}>Aucun challenge disponible à rejoindre.</Text>
          ) : (
            availableChallenges.map((template) => {
              const isJoining = !!joiningTemplateIds[template.id];

              return (
                <View key={template.id} style={styles.availableCard}>
                  <View style={styles.availableCardContent}>
                    <Text style={styles.availableTitle}>{template.title}</Text>
                    <Text style={styles.availableDescription}>{template.description}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                    disabled={isJoining}
                    onPress={() => handleJoinChallenge(template.id)}
                  >
                    {isJoining ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.joinButtonText}>Participer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ChallengeSection>

        <ChallengeSection title="Actifs" count={activeChallenges.length}>
          {isLoading ? (
            <View style={styles.skeleton} />
          ) : activeChallenges.length === 0 ? (
            <View style={commonStyles.emptyContainer}>
              <View style={commonStyles.emptyIconWrapper}>
                <Trophy size={24} color="#d97706" />
              </View>
              <Text style={commonStyles.emptyTitle}>Aucun challenge actif</Text>
              <Text style={commonStyles.emptySubtitle}>
                Ajoutez de la progression à vos livres pour lancer vos défis.
              </Text>
            </View>
          ) : (
            activeChallenges.map((item) => (
              <ChallengeProgressCard key={item.instance.id} item={item} />
            ))
          )}
        </ChallengeSection>

        <ChallengeSection title="Complétés" count={completedChallenges.length}>
          {completedChallenges.length === 0 ? (
            <Text style={styles.muted}>Aucun challenge complété pour le moment.</Text>
          ) : (
            completedChallenges.slice(0, 5).map((item) => (
              <ChallengeProgressCard key={item.instance.id} item={item} />
            ))
          )}
        </ChallengeSection>

        <ChallengeSection title="Échoués" count={failedChallenges.length}>
          {failedChallenges.length === 0 ? (
            <Text style={styles.muted}>Aucun challenge échoué pour le moment.</Text>
          ) : (
            failedChallenges.slice(0, 5).map((item) => (
              <ChallengeProgressCard key={item.instance.id} item={item} />
            ))
          )}
        </ChallengeSection>

        <ChallengeSection title="Abandonnés" count={archivedChallenges.length}>
          {archivedChallenges.length === 0 ? (
            <Text style={styles.muted}>Aucun challenge abandonné pour le moment.</Text>
          ) : (
            archivedChallenges.slice(0, 5).map((item) => (
              <ChallengeProgressCard key={item.instance.id} item={item} />
            ))
          )}
        </ChallengeSection>

        <ChallengeSection title="Rewards débloquées" count={rewards.length}>
          {rewards.length === 0 ? (
            <View style={commonStyles.emptyContainer}>
              <View style={commonStyles.emptyIconWrapper}>
                <Gift size={24} color="#d97706" />
              </View>
              <Text style={commonStyles.emptyTitle}>Aucune reward débloquée</Text>
              <Text style={commonStyles.emptySubtitle}>
                Complétez un challenge pour débloquer votre première reward.
              </Text>
            </View>
          ) : (
            rewards.slice(0, 8).map((reward) => (
              <RewardUnlockCard key={reward.id} reward={reward} />
            ))
          )}
        </ChallengeSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1917',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 13,
    color: '#78716c',
  },
  skeleton: {
    height: 98,
    borderRadius: 14,
    backgroundColor: '#f5f5f4',
  },
  muted: {
    fontSize: 12,
    color: '#78716c',
  },
  availableCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  availableCardContent: {
    gap: 4,
  },
  availableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1917',
  },
  availableDescription: {
    fontSize: 11,
    color: '#78716c',
  },
  joinButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#b45309',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 94,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#d6d3d1',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  createCtaButton: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  createCard: {
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  createCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57534e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1c1917',
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  goalOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  goalChipSelected: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  goalChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#57534e',
  },
  goalChipTextSelected: {
    color: '#b45309',
  },
  createActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  createActionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f4',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#44403c',
  },
  submitButton: {
    backgroundColor: '#b45309',
  },
  submitButtonDisabled: {
    backgroundColor: '#d6d3d1',
  },
  submitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorText: {
    fontSize: 11,
    color: '#b91c1c',
    fontWeight: '600',
  },
  successText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
});
