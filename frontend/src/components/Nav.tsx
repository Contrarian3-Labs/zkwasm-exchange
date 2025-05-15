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
  const l2account = useAppSelector(AccountSlice.selectL2Account);

  const connectWallet = useCallback(async () => {
    try {
      // 如果已经有L2账户，说明钱包已连接并已登录L2
      if (l2account) {
        setInfoMessage("Wallet connected and logged in");
        setShowResult(true);
        return;
      }
      
      // 如果有L1账户但还没有L2账户，则执行L2登录
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
        return;
      }
      
      // 如果没有L1账户，则先连接L1账户
      let action = await dispatch(AccountSlice.loginL1AccountAsync());
      if (AccountSlice.loginL1AccountAsync.fulfilled.match(action)) {
        console.log("Wallet connected:", action.payload);
        setIsLoggedIn(true);
        setUserName(action.payload.address);
        
        // 连接L1成功后自动登录L2
        setTimeout(async () => {
          try {
            let l2Action = await dispatch(AccountSlice.loginL2AccountAsync("ZKWASM-BEAT"));
            if (AccountSlice.loginL2AccountAsync.fulfilled.match(l2Action)) {
              console.log("L2 Login successful:", l2Action.payload);
              const l2addresshex = "0x" + l2Action.payload.pubkey;
              setUserName("ID(l2address): " + addressAbbreviation(l2addresshex, 5));
            }
          } catch (l2Err: any) {
            console.error("L2 login error:", l2Err);
          }
        }, 1000);
      } else if (AccountSlice.loginL1AccountAsync.rejected.match(action)) {
        const errorMessage = action.error.message || 'Unknown error';
        const userMessage = extractErrorMessage(errorMessage);
        throw new Error("Error: " + userMessage);
      }
    } catch (err: any) {
      setInfoMessage(err.message || "Unknown error");
      setShowResult(true);
    }
  }, [dispatch, l1account, l2account]);

  const handleSearch = useCallback((query: string) => {
    console.log("Search:", query);
    // Implement search logic
  }, []);

  const handleProfileClick = useCallback(() => {
    if (!isLoggedIn) {
      connectWallet();
    }
  }, [connectWallet, isLoggedIn]);

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
      placeholder: "Search trading pairs",
      onSearch: handleSearch,
    },
    menuItems: menuItems,
    auth: {
      isLoggedIn,
      userName,
      // 使用同一个函数处理登录和注册，只显示一个按钮
      onLogin: connectWallet,
      // 如果设置为undefined，polymarket-ui不会显示注册按钮
      onSignUp: undefined,
      onProfileClick: handleProfileClick,
      // 修改按钮文本
      loginText: "connect wallet",
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