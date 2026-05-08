import { createContext, useContext, useState } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(
    JSON.parse(localStorage.getItem('wishlist')) || []
  );

  const save = (updated) => {
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const addToWishlist      = (product) => save([...wishlist, product]);
  const removeFromWishlist = (id)      => save(wishlist.filter(i => i._id !== id));
  const clearWishlist      = ()        => save([]);
  const isWishlisted       = (id)      => wishlist.some(i => i._id === id);

  return (
    <WishlistContext.Provider value={{
      wishlist, addToWishlist, removeFromWishlist, clearWishlist, isWishlisted
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);