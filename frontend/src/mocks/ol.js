// __mocks__/ol.js

module.exports = {
    Map: jest.fn().mockImplementation(() => ({
      setTarget: jest.fn(),
      on: jest.fn(),
      setView: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      // Add other methods as needed
    })),
    View: jest.fn(),
    fromLonLat: jest.fn(),
    toLonLat: jest.fn(),
    TileLayer: jest.fn(),
    XYZ: jest.fn(),
    Style: jest.fn(),
    Circle: jest.fn(),
    Fill: jest.fn(),
    Feature: jest.fn(),
    Point: jest.fn(),
    VectorLayer: jest.fn(),
    VectorSource: jest.fn(),
  };
  