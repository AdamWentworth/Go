import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeRaidCalibrationPanel } from '../../../src/components/tools/NativeRaidCalibrationPanel';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);

describe('NativeRaidCalibrationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    secureStore.getItemAsync.mockResolvedValue(null);
  });

  it('logs a validated observed raid to device storage', async () => {
    render(<NativeRaidCalibrationPanel predictedCleared predictedSeconds={95.4} />);
    await waitFor(() => expect(screen.getByText('No raids logged on this device')).toBeTruthy());
    fireEvent.press(screen.getByText('◷  Log raid'));
    expect(screen.getByText('Log the actual result')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Actual clear time'), '102.5');
    fireEvent.changeText(screen.getByLabelText('Dodge attempts'), '4');
    fireEvent.changeText(screen.getByLabelText('Successful dodges'), '3');
    fireEvent.press(screen.getByText('Save raid observation'));
    await waitFor(() => expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      expect.stringContaining('raid-observations'),
      expect.stringContaining('102.5'),
    ));
    expect(screen.queryByText('Log the actual result')).toBeNull();
  });

  it('rejects impossible dodge evidence', async () => {
    render(<NativeRaidCalibrationPanel predictedCleared predictedSeconds={95.4} />);
    await waitFor(() => expect(screen.getByText('No raids logged on this device')).toBeTruthy());
    fireEvent.press(screen.getByText('◷  Log raid'));
    fireEvent.changeText(screen.getByLabelText('Dodge attempts'), '2');
    fireEvent.changeText(screen.getByLabelText('Successful dodges'), '3');
    fireEvent.press(screen.getByText('Save raid observation'));
    expect(screen.getByText('Successful dodges cannot exceed dodge attempts.')).toBeTruthy();
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('applies and removes a sufficiently supported observed dodge rate', async () => {
    const observations = Array.from({ length: 5 }, (_, index) => ({
      actualCleared: true,
      actualSeconds: 100,
      createdAt: `2026-08-2${index}T00:00:00.000Z`,
      dodgeAttempts: 2,
      dodgeSuccesses: index < 3 ? 2 : 0,
      exactParty: true,
      id: `raid-${index}`,
      latencyMs: null,
      predictedCleared: true,
      predictedSeconds: 98,
    }));
    secureStore.getItemAsync.mockResolvedValue(JSON.stringify(observations));
    const onObservedDodgeRateChange = jest.fn();
    render(
      <NativeRaidCalibrationPanel
        onObservedDodgeRateChange={onObservedDodgeRateChange}
        predictedCleared
        predictedSeconds={98}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText('Use observed dodges').props.disabled).toBe(false));
    fireEvent(screen.getByLabelText('Use observed dodges'), 'valueChange', true);
    await waitFor(() => expect(onObservedDodgeRateChange).toHaveBeenLastCalledWith(.6));
    fireEvent(screen.getByLabelText('Use observed dodges'), 'valueChange', false);
    await waitFor(() => expect(onObservedDodgeRateChange).toHaveBeenLastCalledWith(null));
  });
});
