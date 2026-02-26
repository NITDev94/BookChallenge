import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, Award, Book, Calendar, ChevronRight } from 'lucide-react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';

export const ProfileScreen = () => {
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#57534e" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>Alex Lecteur</Text>
          <Text style={styles.memberSince}>Membre depuis 2023</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.orangeCard]}>
            <View style={styles.iconContainer}>
              <Book size={20} color="#ea580c" />
            </View>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Livres</Text>
          </View>

          <View style={[styles.statCard, styles.blueCard]}>
            <View style={styles.iconContainer}>
              <Award size={20} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>

          <View style={[styles.statCard, styles.purpleCard]}>
            <View style={styles.iconContainer}>
              <Calendar size={20} color="#9333ea" />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Jours (Série)</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Éditer le profil</Text>
            <ChevronRight size={20} color="#a8a29e" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionLeft}>
              <Text style={styles.actionText}>Notifications</Text>
            </View>
            <Text style={styles.actionValue}>On</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.logoutContent}>
              <LogOut size={18} color="#dc2626" />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1917',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#f5f5f4',
    borderRadius: 999,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef3c7',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#78716c',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  orangeCard: {
    backgroundColor: '#fff7ed', // orange-50
    borderColor: '#ffedd5', // orange-100
  },
  blueCard: {
    backgroundColor: '#eff6ff', // blue-50
    borderColor: '#dbeafe', // blue-100
  },
  purpleCard: {
    backgroundColor: '#f5f3ff', // purple-50
    borderColor: '#ede9fe', // purple-100
  },
  iconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#78716c',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#44403c',
  },
  actionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  logoutButton: {
    marginTop: 24,
    borderWidth: 0,
    backgroundColor: '#fef2f2', // red-50
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626', // red-600
  },
});
