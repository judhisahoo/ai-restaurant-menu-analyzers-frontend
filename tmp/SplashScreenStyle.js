import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F2FF', // Light Blue Theme
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },

  topContainer: {
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C6CB0',
  },

  tagline: {
    fontSize: 16,
    color: '#5DADE2',
    marginTop: 5,
  },

  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: 250,
    height: 250,
  },

  bottomContainer: {
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#2C6CB0',
    marginBottom: 10,
  },

  poweredText: {
    marginTop: 10,
    fontSize: 14,
    color: '#5DADE2',
  },
});