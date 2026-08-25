import { Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

type Props = {
  body: string;
  confirmLabel: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export const NativeConfirmationDialog = ({
  body,
  confirmLabel,
  isPending = false,
  onCancel,
  onConfirm,
  title,
  visible,
}: Props) => {
  const light = useColorScheme() === 'light';
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.backdrop}>
        <View style={[styles.card, light && styles.cardLight]}>
          <Text style={styles.eyebrow}>TRAINER ACTION</Text>
          <Text style={[styles.title, light && styles.textLight]}>{title}</Text>
          <Text style={[styles.body, light && styles.mutedLight]}>{body}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={isPending} onPress={onCancel} style={[styles.cancel, light && styles.cancelLight]}>
              <Text style={[styles.cancelText, light && styles.textLight]}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={isPending} onPress={onConfirm} style={[styles.confirm, isPending && styles.disabled]}>
              <Text style={styles.confirmText}>{isPending ? 'Working…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#000000aa' },
  card: { width: '100%', maxWidth: 440, gap: 8, padding: 18, borderWidth: 1, borderColor: '#41757a', borderRadius: 16, backgroundColor: '#171f20' },
  cardLight: { borderColor: '#91aaae', backgroundColor: '#ffffff' },
  eyebrow: { color: '#37c8aa', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  body: { color: '#adbbbd', fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 9 },
  cancel: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#536467', borderRadius: 24 },
  cancelLight: { borderColor: '#a5b3b5' },
  cancelText: { color: '#ffffff', fontWeight: '900' },
  confirm: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#36c5a4' },
  confirmText: { color: '#041411', fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.55 },
  textLight: { color: '#172124' },
  mutedLight: { color: '#5e6c6f' },
});
