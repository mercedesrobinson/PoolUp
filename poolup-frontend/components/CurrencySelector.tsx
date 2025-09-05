import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { colors, radius } from '../theme';
import { SUPPORTED_CURRENCIES, Currency, getUserCurrency } from '../utils/currency';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string) => void;
  style?: any;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
  
  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCurrencySelect = (currencyCode: string) => {
    onCurrencyChange(currencyCode);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[{
          backgroundColor: 'white',
          padding: 12,
          borderRadius: radius.medium,
          borderWidth: 1,
          borderColor: '#e9ecef',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }, style]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>
            {selectedCurrencyInfo?.symbol || '$'}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
            {selectedCurrencyInfo?.code || 'USD'}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>
            {selectedCurrencyInfo?.name || 'US Dollar'}
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: '#666' }}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
          }}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ padding: 8, marginRight: 12 }}
            >
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#333',
              flex: 1,
            }}>
              Select Currency
            </Text>
          </View>

          {/* Search */}
          <View style={{ padding: 16 }}>
            <TextInput
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: radius.medium,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontSize: 16,
              }}
              placeholder="Search currencies..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Currency List */}
          <ScrollView style={{ flex: 1 }}>
            <View style={{ padding: 16, paddingTop: 0 }}>
              {filteredCurrencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  onPress={() => handleCurrencySelect(currency.code)}
                  style={{
                    backgroundColor: 'white',
                    padding: 16,
                    borderRadius: radius.medium,
                    marginBottom: 8,
                    borderWidth: selectedCurrency === currency.code ? 2 : 1,
                    borderColor: selectedCurrency === currency.code ? colors.primary : '#e9ecef',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>
                      {currency.symbol}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                        {currency.code}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#666' }}>
                        {currency.name}
                      </Text>
                    </View>
                    {currency.exchangeRate && currency.exchangeRate !== 1.0 && (
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        ≈ ${currency.exchangeRate.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {selectedCurrency === currency.code && (
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Info */}
          <View style={{
            backgroundColor: '#fff3cd',
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: '#e9ecef',
          }}>
            <Text style={{ fontSize: 14, color: '#856404', textAlign: 'center' }}>
              💡 Exchange rates are approximate and updated periodically
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};
