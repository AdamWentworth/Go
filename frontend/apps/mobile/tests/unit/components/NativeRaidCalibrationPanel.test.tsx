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
});
