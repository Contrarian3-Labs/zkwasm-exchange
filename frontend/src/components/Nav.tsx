import React, { useCallback, useState, useEffect } from "react";
import {
  MDBContainer,
  MDBNavbar,
  MDBCol,
  MDBBtn,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem
} from 'mdb-react-ui-kit';
import { NavbarUI, useThemeContext } from "polymarket-ui";
import {
  UserIcon,
  InformationCircleIcon,
  Squares2X2Icon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { AccountSlice } from "zkwasm-minirollup-browser";
import { extractErrorMessage } from "../utils/transaction";
import { addressAbbreviation } from "../utils/address";
import { ResultModal } from "../modals/ResultModal";
import { bnToHexLe } from "delphinus-curves/src/altjubjub";
import { LeHexBN } from 'zkwasm-minirollup-rpc';

interface NavProps {
  handleTabClick: (value: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export default function Nav(props: NavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>();
  const { isDarkMode, toggleDarkMode } = useThemeContext();
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [pidInfo, setPidInfo] = useState<string>("");
  const dispatch = useAppDispatch();
  const l1account = useAppSelector(AccountSlice.selectL1Account);
  const l2account = useAppSelector(AccountSlice.selectL2Account);
  // 用于跟踪搜索输入变化的内部状态
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  console.log("pidInfo:", pidInfo);

  // 定义一个函数用于自动恢复登录状态，与connectWallet分开
  const attemptAutoLogin = useCallback(async () => {
    try {
      // 如果已经有账户信息，不需要自动登录
      if (l1account || l2account) {
        return;
      }
      
      const l2LoggedIn = localStorage.getItem('zkwasm_l2_logged_in');
      const l1LoggedIn = localStorage.getItem('zkwasm_l1_logged_in');
      
      if (l2LoggedIn === 'true' || l1LoggedIn === 'true') {
        console.log("尝试自动恢复登录状态");
        setIsLoggedIn(true);
        setUserName("正在恢复账户...");
        
        // 直接调用Redux action而不是connectWallet函数
        try {
          // 先尝试连接钱包（L1账户）
          let l1Action = await dispatch(AccountSlice.loginL1AccountAsync());
          if (AccountSlice.loginL1AccountAsync.fulfilled.match(l1Action)) {
            console.log("自动恢复L1登录成功:", l1Action.payload);
            
            // 如果之前有L2登录状态，继续尝试L2登录
            if (l2LoggedIn === 'true') {
              let l2Action = await dispatch(AccountSlice.loginL2AccountAsync("ZKWASM-BEAT"));
              if (AccountSlice.loginL2AccountAsync.fulfilled.match(l2Action)) {
                console.log("自动恢复L2登录成功:", l2Action.payload);
              }
            }
          }
        } catch (error) {
          console.error("自动登录失败:", error);
          // 清除localStorage中的登录状态
          localStorage.removeItem('zkwasm_l1_logged_in');
          localStorage.removeItem('zkwasm_l1_address');
          localStorage.removeItem('zkwasm_l2_logged_in');
          localStorage.removeItem('zkwasm_l2_pubkey');
          setIsLoggedIn(false);
          setUserName(undefined);
        }
      }
    } catch (error) {
      console.error("尝试自动登录时出错:", error);
    }
  }, [dispatch, l1account, l2account]);

  // 添加useEffect来监听账户状态并更新isLoggedIn
  useEffect(() => {
    // 如果有L2账户或L1账户，则认为已登录
    if (l2account || l1account) {
      console.log("账户状态更新 - 发现账户信息，设置登录状态为true");
      setIsLoggedIn(true);
      // 如果有L2账户，设置用户名为L2地址
      if (l2account) {
        const l2addresshex = "0x" + l2account.pubkey;
        setUserName("ID(l2address): " + addressAbbreviation(l2addresshex, 5));
        // console.log("设置L2用户名:", "ID(l2address): " + addressAbbreviation(l2addresshex, 5));
      } else if (l1account) {
        // 只有L1账户时显示L1地址
        setUserName(l1account.address);
        console.log("设置L1用户名:", l1account.address);
      }
    } else {
      console.log("账户状态更新 - 没有找到账户信息，设置登录状态为false");
      setIsLoggedIn(false);
      setUserName(undefined);
    }
  }, [l1account, l2account]);

  // 添加本地存储检查，在组件挂载时尝试恢复登录状态
  useEffect(() => {
    // 检查Redux状态是否已经表明用户已登录
    if (l1account || l2account) {
      console.log("组件初始化 - Redux已有账户信息");
      return; // 已经在上面的useEffect中处理了
    }
    
    // 尝试自动登录
    attemptAutoLogin();
  }, [attemptAutoLogin, l1account, l2account]);

  // 当外部searchQuery发生变化时，更新本地状态
  useEffect(() => {
    if (props.searchQuery !== undefined) {
      setLocalSearchQuery(props.searchQuery);
    }
  }, [props.searchQuery]);

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
          
          // 保存登录状态到localStorage
          try {
            localStorage.setItem('zkwasm_l2_logged_in', 'true');
            // 可以考虑保存一些非敏感信息，如公钥
            localStorage.setItem('zkwasm_l2_pubkey', action.payload.pubkey.toString());
          } catch (err) {
            console.error("Error saving login state to localStorage:", err);
          }
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
        
        // 保存L1登录状态到localStorage
        try {
          localStorage.setItem('zkwasm_l1_logged_in', 'true');
          localStorage.setItem('zkwasm_l1_address', action.payload.address);
        } catch (err) {
          console.error("Error saving L1 login state to localStorage:", err);
        }
        
        // 连接L1成功后自动登录L2
        setTimeout(async () => {
          try {
            let l2Action = await dispatch(AccountSlice.loginL2AccountAsync("ZKWASM-BEAT"));
            if (AccountSlice.loginL2AccountAsync.fulfilled.match(l2Action)) {
              console.log("L2 Login successful:", l2Action.payload);
              const l2addresshex = "0x" + l2Action.payload.pubkey;
              setUserName("ID(l2address): " + addressAbbreviation(l2addresshex, 5));
              console.log("L2 Login successful:", l2Action.payload);
              
              // 保存L2登录状态到localStorage
              try {
                localStorage.setItem('zkwasm_l2_logged_in', 'true');
                localStorage.setItem('zkwasm_l2_pubkey', l2Action.payload.pubkey.toString());
              } catch (err) {
                console.error("Error saving L2 login state to localStorage:", err);
              }
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

  const handleShowPid = useCallback(() => {
    if (!l2account) {
      // setInfoMessage("请先连接钱包获取L2账户");
      setInfoMessage("Please connect wallet to get L2 account");
      setShowResult(true);
      return;
    }

    try {
      // 获取公钥信息
      const pubkey = l2account?.pubkey || "";
      console.log("pubkey:", pubkey);
      
      // 输出L2Account详细信息用于调试
      console.log("L2Account detailed information:", l2account);
      
      // 使用bnToHexLe函数从公钥计算PID
      const pid = bnToHexLe(pubkey);

      let pid2 = new LeHexBN(pid).toU64Array();
      
      if (pid && pid.length >= 16) {
        // 构建PID信息，同时显示十进制和十六进制形式
        const pidDisplay = `PID string (for deposit/transfer): \n${pid}\n\nPID2: [${pid2[1]}, ${pid2[2]}]`;
        
        setPidInfo(pidDisplay);
        setInfoMessage(pidDisplay);
        setShowResult(true);
      } else {
        throw new Error("生成的PID格式不正确");
      }
    } catch (err: any) {
      console.error("Error getting PID:", err);
      setInfoMessage("获取PID失败: " + (err.message || "未知错误"));
      setShowResult(true);
    }
  }, [l2account]);

  // 处理搜索输入变化，直接通知父组件
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearchQuery(value);
    
    // 如果清空了搜索框，立即通知父组件显示所有内容
    if (value === "" && props.setSearchQuery) {
      props.setSearchQuery("");
    }
  }, [props]);

  // 处理搜索提交
  const handleSearch = useCallback((query: string) => {
    // 将搜索控制权转移到Main组件
    if (props.setSearchQuery) {
      props.setSearchQuery(query);
    }
  }, [props]);

  const handleProfileClick = useCallback(() => {
    if (!isLoggedIn) {
      connectWallet();
    }
  }, [connectWallet, isLoggedIn]);

  // 添加退出登录功能
  const handleLogout = useCallback(() => {
    // 清除localStorage中的登录状态
    localStorage.removeItem('zkwasm_l1_logged_in');
    localStorage.removeItem('zkwasm_l1_address');
    localStorage.removeItem('zkwasm_l2_logged_in');
    localStorage.removeItem('zkwasm_l2_pubkey');
    
    // 更新UI状态
    setIsLoggedIn(false);
    setUserName(undefined);
    
    // 显示退出成功消息
    setInfoMessage("已成功退出登录");
    setShowResult(true);
    
    console.log("用户已退出登录");
    
    // 注意：这里没有实际从Redux中清除账户状态
    // 在实际应用中，你可能需要dispatch一个action来清除Redux中的账户状态
    // 例如: dispatch(AccountSlice.logoutAccount());
  }, []);

  const handleLogoClick = useCallback(() => {
    console.log("Logo clicked");
    // 重置搜索并立即通知父组件
    setLocalSearchQuery("");
    if (props.setSearchQuery) {
      props.setSearchQuery("");
    }
  }, [props]);

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
      placeholder: "Search markets by ID, token, price or status",
      onSearch: handleSearch,
      onChange: handleInputChange, // 添加输入变化处理
      value: localSearchQuery, // 使用本地状态
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
          {isLoggedIn && (
            <>
              <MDBBtn 
                color='primary' 
                size='sm' 
                className='ms-2'
                onClick={handleShowPid}
              >
                <IdentificationIcon className="h-5 w-5 me-1" />
                查看 PID
              </MDBBtn>
              <MDBDropdown>
                <MDBDropdownToggle tag='a' className='btn btn-outline-primary btn-sm ms-2'>
                  账户
                </MDBDropdownToggle>
                <MDBDropdownMenu>
                  <MDBDropdownItem link onClick={handleLogout}>退出登录</MDBDropdownItem>
                </MDBDropdownMenu>
              </MDBDropdown>
            </>
          )}
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