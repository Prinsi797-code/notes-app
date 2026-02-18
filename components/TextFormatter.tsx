import { useLanguage } from '@/contexts/LanguageContext';
import { TextStyle } from '@/types/Note';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TextFormatterProps {
  textStyle: TextStyle;
  onToggle: (key: keyof TextStyle) => void;
  label?: string;
  
}

export const TextFormatter: React.FC<TextFormatterProps> = ({
  textStyle,
  onToggle,
  label = 'Text Style',
}) => {
    const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.button, textStyle.bold && styles.buttonActive]}
          onPress={() => onToggle('bold')}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, textStyle.bold && styles.buttonTextActive]}>
            B
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, textStyle.italic && styles.buttonActive]}
          onPress={() => onToggle('italic')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              { fontStyle: 'italic' },
              textStyle.italic && styles.buttonTextActive,
            ]}
          >
            I
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, textStyle.underline && styles.buttonActive]}
          onPress={() => onToggle('underline')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              { textDecorationLine: 'underline' },
              textStyle.underline && styles.buttonTextActive,
            ]}
          >
            U
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, textStyle.list && styles.buttonActive]}
          onPress={() => onToggle('list')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="list"
            size={20}
            color={textStyle.list ? '#fff' : '#333'}
          />
        </TouchableOpacity>
      </View>
      {/* <Text style={styles.hint}>
        {textStyle.list ? t('home.eachLine')  : t('home.styleText')}
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#6200EE',
    borderColor: '#6200EE',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  buttonTextActive: {
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
});