import React, { useCallback, useState } from "react";
import {
  MDBContainer,
  MDBNavbar,
  MDBCol
} from 'mdb-react-ui-kit';
import { NavbarUI, useThemeContext } from "polymarket-ui";
import {
  UserIcon,
  InformationCircleIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { AccountSlice } from "zkwasm-minirollup-browser";
import { extractErrorMessage } from "../utils/transaction";
import { addressAbbreviation } from "../utils/address";
import { ResultModal } from "../modals/ResultModal";

interface NavProps {
  handleTabClick: (value: string) => void;
}

export default function Nav(props: NavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>();
  const { isDarkMode, toggleDarkMode } = useThemeContext();
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const dispatch = useAppDispatch();
  const l1account = useAppSelector(AccountSlice.selectL1Account);

  const connect = useCallback(async () => {
    try {
      let action = await dispatch(AccountSlice.loginL1AccountAsync());

      if (AccountSlice.loginL1AccountAsync.fulfilled.match(action)) {
        console.log("Login successful:", action.payload);
        setIsLoggedIn(true);
        setUserName(action.payload.address);
      } else if (AccountSlice.loginL1AccountAsync.rejected.match(action)) {
        const errorMessage = action.error.message || 'Unknown error';
        const userMessage = extractErrorMessage(errorMessage);
        throw new Error("Error: " + userMessage);
      }
    } catch (err: any) {
      setInfoMessage(err.message || "Unknown error");
      setShowResult(true);
    }
  }, [dispatch]);

  const login = useCallback(async () => {
    try {
      console.log(l1account, isLoggedIn, userName)
      if (l1account) {
        let action = await dispatch(AccountSlice.loginL2AccountAsync("ZKWASM-BEAT"));
        console.log("dispatch result:", action);
        if (AccountSlice.loginL2AccountAsync.fulfilled.match(action)) {
          console.log("Login successful:", action.payload);
          const l2addresshex = "0x" + action.payload.pubkey;
          setIsLoggedIn(true);
          setUserName("ID(l2address): " + addressAbbreviation(l2addresshex, 5));
        } else if (AccountSlice.loginL2AccountAsync.rejected.match(action)) {
          const errorMessage = action.error.message || 'Unknown error';
          const userMessage = extractErrorMessage(errorMessage);
          throw new Error("Error: " + userMessage);
        }
      } else {
        setInfoMessage("Please sign up first!");
        setShowResult(true);
      }
    } catch (err: any) {
      setInfoMessage(err.message || "Unknown error");
      setShowResult(true);
    }
  }, [dispatch, isLoggedIn, l1account, userName]);

  const handleSearch = useCallback((query: string) => {
    console.log("Search:", query);
    // Implement search logic
  }, []);

  const handleLogin = useCallback(async () => {
    await login();
  }, [login]);

  const handleSignUp = useCallback(async () => {
    await connect();
  }, [connect]);

  const handleProfileClick = useCallback(() => {
    login();
  }, [login]);

  const handleLogoClick = useCallback(() => {
    console.log("Logo clicked");
    // Implement navigation to home
  }, []);

  const menuItems = [
    { label: "Admin Balance", onClick: () => props.handleTabClick("1"), icon: UserIcon },
    { label: "Wallet Player Balance", onClick: () => props.handleTabClick("2"), icon: UserIcon },
    { label: "Token Info", onClick: () => props.handleTabClick("3"), icon: InformationCircleIcon },
    { label: "Market Data", onClick: () => props.handleTabClick("4"), icon: Squares2X2Icon },
    { label: "Trade Info", onClick: () => props.handleTabClick("5"), icon: InformationCircleIcon }
  ];

  const navBarProps = {
    logo: {
      text: "ZKWASM Exchange",
      onClick: handleLogoClick,
    },
    search: {
      placeholder: "Search markets",
      onSearch: handleSearch,
    },
    menuItems: menuItems,
    auth: {
      isLoggedIn,
      userName,
      onLogin: handleLogin,
      onSignUp: handleSignUp,
      onProfileClick: handleProfileClick,
    },
    darkMode: {
      enabled: isDarkMode,
      onToggle: toggleDarkMode,
    }
  };

  return (
    <>
    <MDBNavbar expand='lg' light bgColor='light'>
      <MDBContainer fluid>
        <MDBCol md="12">
          <NavbarUI {...navBarProps} />
        </MDBCol>
      </MDBContainer>
    </MDBNavbar>
    <ResultModal
      infoMessage={infoMessage}
      show={showResult}
      onClose={() => setShowResult(false)}
    />
    </>
  );
}