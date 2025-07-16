import React, { createContext, useContext, useState } from 'react';

type Photo = {
  photoUri: string;
  caption: string;
  latitude: string;
  longitude: string;
  locationName: string;
};

type PhotoContextType = {
  photos: Photo[];
  addPhoto: (photo: Photo) => void;
};

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const usePhotoStore = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotoStore must be used within a PhotoProvider');
  }
  return context;
};

export const PhotoProvider = ({ children }: { children: React.ReactNode }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const addPhoto = (photo: Photo) => {
    setPhotos((prev) => [...prev, photo]);
  };

  return (
    <PhotoContext.Provider value={{ photos, addPhoto }}>
      {children}
    </PhotoContext.Provider>
  );
};
