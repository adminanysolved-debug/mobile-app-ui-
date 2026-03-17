import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

import { getApiUrl } from '../lib/query-client';

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { plan } = route.params;
  const { user, refreshUser, token } = useAuth();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !cardName) {
      Alert.alert('Incomplete Data', 'Please fill in all credit card details.');
      return;
    }

    // Clean card number for check
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard !== '4242424242424242') {
      Alert.alert('Invalid Card', 'Please use the testing card number: 4242 4242 4242 4242');
      return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const baseUrl = getApiUrl();
      
      // 1. Process Dummy Payment
      const paymentRes = await fetch(new URL('/api/payments/dummy', baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardNumber: cleanCard,
          expiry,
          cvv,
          amount: plan.price.split(' ')[1]
        })
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error || 'Payment failed');

      // 2. Upgrade Subscription
      const upgradeRes = await fetch(new URL('/api/subscriptions/upgrade', baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tier: plan.id,
          type: 'user'
        })
      });

      const upgradeData = await upgradeRes.json();
      if (!upgradeRes.ok) throw new Error(upgradeData.error || 'Upgrade failed');

      // Success
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Success!', 
        `You have successfully upgraded to the ${plan.name} plan.`,
        [{ text: 'Great!', onPress: () => navigation.navigate('Profile') }]
      );

    } catch (error: any) {
      console.error('Payment Error:', error);
      Alert.alert('Payment Failed', error.message || 'Something went wrong during the transaction.');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    setCardNumber(groups ? groups.join(' ') : cleaned);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      setExpiry(cleaned);
    } else {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.orderSummary}>
            <Text style={styles.summaryLabel}>Upgrading to</Text>
            <View style={styles.planBadge}>
                <Text style={styles.planName}>{plan.name} Plan</Text>
                <Text style={styles.planPrice}>{plan.price}/mo</Text>
            </View>
          </View>

          <View style={styles.cardPreview}>
            <LinearGradient 
                colors={['#4f46e5', '#3730a3']} 
                start={{x:0, y:0}} 
                end={{x:1, y:1}} 
                style={styles.cardGradient}
            >
                <View style={styles.cardTop}>
                    <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.4)" style={{ transform: [{ rotate: '90deg' }] }} />
                    <Text style={styles.cardVendor}>RealDream Virtual</Text>
                </View>
                
                <Text style={styles.cardNumberDisplay}>
                    {cardNumber || '•••• •••• •••• ••••'}
                </Text>

                <View style={styles.cardBottom}>
                    <View>
                        <Text style={styles.cardLabel}>CARD HOLDER</Text>
                        <Text style={styles.cardValue}>{cardName.toUpperCase() || 'YOUR NAME'}</Text>
                    </View>
                    <View>
                        <Text style={styles.cardLabel}>EXPIRES</Text>
                        <Text style={styles.cardValue}>{expiry || 'MM/YY'}</Text>
                    </View>
                </View>
            </LinearGradient>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#475569"
                    value={cardName}
                    onChangeText={setCardName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        maxLength={5}
                        value={expiry}
                        onChangeText={formatExpiry}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                        value={cvv}
                        onChangeText={setCvv}
                    />
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.payButton, loading && styles.disabledButton]}
                onPress={handlePayment}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.payButtonText}>Finalize Transaction</Text>
                    </>
                )}
            </TouchableOpacity>

            <Text style={styles.secureText}>
                <Ionicons name="shield-checkmark" size={12} color="#10b981" /> End-to-end encrypted neural checkout
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  content: {
    flex: 1,
    paddingHorizontal: 25,
  },
  orderSummary: {
    marginVertical: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  planBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  planName: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '900',
  },
  planPrice: {
      color: '#818cf8',
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 10,
  },
  cardPreview: {
    width: '100%',
    height: 200,
    marginBottom: 30,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 25,
    justifyContent: 'space-between',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardVendor: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
  },
  cardNumberDisplay: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 15,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  row: {
    flexDirection: 'row',
  },
  payButton: {
    backgroundColor: '#6366f1',
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secureText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  }
});
