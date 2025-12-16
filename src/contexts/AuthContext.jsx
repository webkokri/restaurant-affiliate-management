import React, { createContext, useContext, useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Twilio configuration (from environment variables)
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_APP_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_APP_TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = import.meta.env.VITE_APP_TWILIO_SERVICE_SID;

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    // Check for stored session on app load
    const storedUser = localStorage.getItem('authUser');
    if (storedUser && import.meta.env.DEV) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        // Load customer data for stored user
        loadCustomerData(user.phoneNumber);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authUser');
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        // Load customer data when user is authenticated
        loadCustomerData(user.phoneNumber);
      } else if (!storedUser || !import.meta.env.DEV) {
        setCurrentUser(null);
        setCustomerData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadCustomerData = async (phoneNumber) => {
    try {
      const customersCollection = collection(db, 'customers');
      const customerRef = doc(customersCollection, phoneNumber);
      const customerSnap = await getDoc(customerRef);

      if (customerSnap.exists()) {
        setCustomerData(customerSnap.data());
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const sendOTP = async (phoneNumber, referralCode = null) => {
    try {
      // Check if we're in development mode and Twilio credentials are properly configured
      const isDevelopment = import.meta.env.DEV;
      const hasValidCredentials = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SERVICE_SID && TWILIO_SERVICE_SID.startsWith('VA'); // Verify services start with VA

      if (isDevelopment && !hasValidCredentials) {
        // Development fallback: Mock OTP
        console.log(`[DEV MODE] Mock OTP sent to ${phoneNumber}`);
        const mockOtp = '123456';

        setConfirmationResult({
          phoneNumber,
          confirm: async (inputOtp) => {
            if (inputOtp === mockOtp) {
              // Store customer data in Firestore even in development
              const customersCollection = collection(db, 'customers');
              const customerRef = doc(customersCollection, phoneNumber);
              const customerSnap = await getDoc(customerRef);

              if (!customerSnap.exists()) {
                // Create new customer record
                const referralId = generateReferralId();

                // Handle referral if provided
                let referredBy = null;
                if (referralCode) {
                  console.log('Processing referral code during OTP (dev):', referralCode);
                  // Find the referrer
                  const referrerQuery = query(collection(db, 'customers'), where('referralId', '==', referralCode));
                  const referrerSnap = await getDocs(referrerQuery);
                  if (!referrerSnap.empty) {
                    referredBy = referralCode; // Store the referral code used
                    console.log('Referral linked successfully (dev):', phoneNumber, 'referred by code', referredBy);
                  } else {
                    console.warn('Invalid referral code (dev):', referralCode, 'for user:', phoneNumber);
                  }
                }

                await setDoc(customerRef, {
                  phoneNumber,
                  createdAt: new Date(),
                  lastLoginAt: new Date(),
                  authMethod: 'phone',
                  status: 'active',
                  referralId,
                  referredBy,
                  role: 'customer',
                  isDevelopment: true // Mark as development login
                });
                console.log('New customer created in Firestore (dev):', phoneNumber, 'referredBy:', referredBy);
              }
              // Do not update if already exists

              return {
                user: {
                  phoneNumber,
                  uid: phoneNumber,
                  providerData: [{ providerId: 'phone', uid: phoneNumber }]
                }
              };
            } else {
              throw new Error('Invalid OTP');
            }
          }
        });

        alert(`[DEV MODE] Mock OTP: ${mockOtp}`);
        return { success: true };
      }

      // Production: Use Twilio Verify API
      const response = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_SERVICE_SID}/Verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)
        },
        body: new URLSearchParams({
          To: phoneNumber,
          Channel: 'sms'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twilio API Error:', errorData);
        throw new Error(`Failed to send SMS: ${errorData.message}`);
      }

      const data = await response.json();
      console.log('OTP sent via Twilio Verify:', data.sid);

      // Store phone number for verification
      setConfirmationResult({
        phoneNumber,
        confirm: async (inputOtp) => {
          // Use Twilio Verify API for verification
          const verifyResponse = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_SERVICE_SID}/VerificationCheck`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: 'Basic ' + btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)
            },
            body: new URLSearchParams({
              To: phoneNumber,
              Code: inputOtp
            })
          });

          if (!verifyResponse.ok) {
            throw new Error('Invalid OTP');
          }

          const verifyData = await verifyResponse.json();

          if (verifyData.status === 'approved') {
            // Store customer data in Firestore
            const customersCollection = collection(db, 'customers');
            const customerRef = doc(customersCollection, phoneNumber);
            const customerSnap = await getDoc(customerRef);

            if (!customerSnap.exists()) {
              // Create new customer record
              const referralId = generateReferralId();

              // Handle referral if provided
              let referredBy = null;
              if (referralCode) {
                console.log('Processing referral code during OTP (prod):', referralCode);
                // Find the referrer
                const referrerQuery = query(collection(db, 'customers'), where('referralId', '==', referralCode));
                const referrerSnap = await getDocs(referrerQuery);
                if (!referrerSnap.empty) {
                  referredBy = referralCode; // Store the referral code used
                  console.log('Referral linked successfully (prod):', phoneNumber, 'referred by code', referredBy);
                } else {
                  console.warn('Invalid referral code (prod):', referralCode, 'for user:', phoneNumber);
                }
              }

              await setDoc(customerRef, {
                phoneNumber,
                createdAt: new Date(),
                lastLoginAt: new Date(),
                authMethod: 'phone',
                status: 'active',
                referralId,
                referredBy,
                role: 'customer'
              });
              console.log('New customer created in Firestore:', phoneNumber, 'referredBy:', referredBy);
            }
            // Do not update if already exists

            return {
              user: {
                phoneNumber,
                uid: phoneNumber,
                providerData: [{ providerId: 'phone', uid: phoneNumber }]
              }
            };
          } else {
            throw new Error('Invalid OTP');
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  };

  const verifyOTP = async (otp) => {
    try {
      if (!confirmationResult) {
        throw new Error('No OTP request found');
      }
      const result = await confirmationResult.confirm(otp);

      // Check if customer already exists and get their data
      const customersCollection = collection(db, 'customers');
      const customerRef = doc(customersCollection, result.user.phoneNumber);
      const customerSnap = await getDoc(customerRef);

      // Store customer data if exists
      if (customerSnap.exists()) {
        setCustomerData(customerSnap.data());
      }

      // Create a Firebase Auth user session
      // Since we're using custom phone auth, we'll create a custom token or use Firebase Auth emulator
      if (import.meta.env.DEV) {
        // In development, sign in anonymously or use a custom approach
        // For simplicity, we'll set the user directly and rely on localStorage for persistence
        setCurrentUser(result.user);
        // Store session in localStorage for persistence
        localStorage.setItem('authUser', JSON.stringify(result.user));
      } else {
        // In production, you might want to use Firebase Auth custom tokens
        setCurrentUser(result.user);
      }

      console.log('verifyOTP - isNewCustomer:', !customerSnap.exists(), 'phoneNumber:', result.user.phoneNumber);
      return { user: result.user, isNewCustomer: !customerSnap.exists() };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Invalid OTP');
    }
  };

  const logout = async () => {
    setConfirmationResult(null);
    setCurrentUser(null);
    setCustomerData(null);
    localStorage.removeItem('authUser');
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const generateReferralId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const saveCustomerName = async (phoneNumber, fullName, referralCode = null) => {
    try {
      console.log('saveCustomerName called with:', { phoneNumber, fullName, referralCode });

      const customersCollection = collection(db, 'customers');
      const customerRef = doc(customersCollection, phoneNumber);

      // Check if customer already exists
      const customerSnap = await getDoc(customerRef);
      const existingData = customerSnap.exists() ? customerSnap.data() : {};

      console.log('Existing customer data:', existingData);

      // Generate referral ID if not exists
      const referralId = existingData.referralId || generateReferralId();

      // Handle referral if provided (only if not already set during OTP)
      let referredBy = existingData.referredBy;
      if (referralCode && !referredBy) {
        console.log('Processing referral code in saveCustomerName:', referralCode);
        // Find the referrer
        const referrerQuery = query(customersCollection, where('referralId', '==', referralCode));
        const referrerSnap = await getDocs(referrerQuery);
        if (!referrerSnap.empty) {
          referredBy = referralCode; // Store the referral code used, not the referrer's phone number
          console.log('Referral linked successfully in saveCustomerName:', phoneNumber, 'referred by code', referredBy);
        } else {
          console.warn('Invalid referral code in saveCustomerName:', referralCode, 'for user:', phoneNumber);
        }
      } else {
        console.log('No referral code processing needed in saveCustomerName:', { referralCode, referredBy });
      }

      const updateData = {
        phoneNumber,
        fullName,
        referralId,
        referredBy,
        createdAt: existingData.createdAt || new Date(),
        lastLoginAt: new Date(),
        authMethod: 'phone',
        status: 'active',
        role: existingData.role || 'customer'
      };

      console.log('Saving customer data in saveCustomerName:', updateData);

      await setDoc(customerRef, updateData, { merge: true });

      console.log('Customer data saved in Firestore via saveCustomerName:', phoneNumber);
    } catch (error) {
      console.error('Error saving customer data:', error);
      throw new Error('Failed to save customer information');
    }
  };

  const value = {
    currentUser,
    customerData,
    setCustomerData,
    sendOTP,
    verifyOTP,
    saveCustomerName,
    logout
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
