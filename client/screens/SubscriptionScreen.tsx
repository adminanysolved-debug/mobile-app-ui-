import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'silver',
    name: 'Silver',
    price: 'GBP 0',
    subtitle: 'Free Forever',
    colors: ['#94a3b8', '#475569'],
    features: [
      'Up to 10 Personal Dreams',
      '1 Team Dream Participation',
      '3 Friend Challenges',
      'Standard Support'
    ],
    buttonText: 'Current Plan'
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 'GBP 3.99',
    subtitle: 'per month',
    popular: true,
    colors: ['#fbbf24', '#b45309'],
    features: [
      'Up to 14 Personal Dreams',
      '3 Team Dream Participation',
      '5 Friend Challenges',
      'Priority Support',
      'Exclusive Badges'
    ],
    buttonText: 'Upgrade to Gold'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 'GBP 5.99',
    subtitle: 'per month',
    colors: ['#6366f1', '#4338ca'],
    features: [
      'Up to 20 Personal Dreams',
      '5 Team Dream Participation',
      '10 Friend Challenges',
      '24/7 Premium Support',
      'Elite Wall of Fame Status',
      'Early access to V3 features'
    ],
    buttonText: 'Upgrade to Platinum'
  }
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    if (user?.subscriptionTier === plan.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Payment', { plan });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Elevate Your Dreams</Text>
          <Text style={styles.introSubtitle}>Choose the plan that fits your ambition</Text>
          
          <View style={styles.offerBadge}>
              <Text style={styles.offerText}>6 MONTHS FREE Introductory Offer on Gold/Platinum</Text>
          </View>
        </View>

        {PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.popularCard]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}

            <LinearGradient 
              colors={plan.colors as [string, string, ...string[]]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
              style={styles.planHeader}
            >
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
            </LinearGradient>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={plan.colors[0]} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.selectButton, 
                user?.subscriptionTier === plan.id && styles.currentPlanButton,
                { backgroundColor: user?.subscriptionTier === plan.id ? '#334155' : plan.colors[0] }
              ]}
              onPress={() => handleSelectPlan(plan)}
              disabled={user?.subscriptionTier === plan.id}
            >
              <Text style={styles.selectButtonText}>
                {user?.subscriptionTier === plan.id ? 'Current Plan' : plan.buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Payments are processed securely. You can cancel your subscription anytime from your profile settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  introTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  introSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  offerBadge: {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.3)',
      marginTop: 20,
  },
  offerText: {
      color: '#818cf8',
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 1,
      textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    marginBottom: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  popularCard: {
    borderColor: '#fbbf24',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    backgroundColor: '#fbbf24',
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderBottomLeftRadius: 15,
    zIndex: 10,
  },
  popularText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  planHeader: {
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  planSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  featuresContainer: {
    padding: 25,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
  selectButton: {
    margin: 25,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  currentPlanButton: {
    opacity: 0.8,
  },
  footer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  }
});
