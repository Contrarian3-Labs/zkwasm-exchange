import React, { useState } from "react";
import { ethers } from "ethers";
import {
  MDBModal,
  MDBModalHeader,
  MDBModalBody,
  MDBModalFooter,
  MDBBtn,
  MDBInputGroup,
  MDBSpinner,
  MDBModalContent,
  MDBModalDialog
} from "mdb-react-ui-kit";
import ErrorAlert from '../components/ErrorAlert';
import { validateIndex, validateHexString, formatAddress, formatErrorMessage } from "../utils/transaction";
import { ResultModal } from "./ResultModal";

export interface WithdrawTokenProps {
  show: boolean;
  onClose: () => void;
  handler: (tokenIndex: bigint, address: string, amount: bigint) => Promise<string | undefined>
}

const WithdrawTokenModal: React.FC<WithdrawTokenProps> = ({
  show,
  onClose,
  handler
}) => {
  const [tokenIndex, setTokenIndex] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showResult, setShowResult] = useState(false);

  const closeModal = () => {
    setTokenIndex('');
    setAddress('');
    setAmount('');
    setErrorMessage("");
    onClose();
  }

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!tokenIndex) {
        throw new Error("Token index is missing");
      }

      if (!address) {
        throw new Error("The address is missing");
      }

      if (!amount) {
        throw new Error("Token amount is missing");
      }

      setIsExecuting(true);

      // Validate token index
      const cleanedTokenIndex = parseInt(tokenIndex.trim());
      validateIndex(cleanedTokenIndex);

      // Validate token address
      const cleanedAddress = address.trim();
      validateHexString(cleanedAddress, 40);
      const formattedAddress = formatAddress(cleanedAddress);
      const validAddress = ethers.getAddress(formattedAddress);
      
      // Validate token amount
      const cleanedAmount = parseInt(amount.trim());
      validateIndex(cleanedAmount, 64);

      const result = await handler(BigInt(cleanedTokenIndex), validAddress, BigInt(cleanedAmount));
      if(result) {
        setInfoMessage(result);
        setShowResult(true);
      }
      closeModal();
    } catch (error) {
      const err = formatErrorMessage(error);
      setErrorMessage(`withdraw token: ${err}`);
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <>
      <MDBModal open={show} onClose={closeModal} staticBackdrop tabIndex='-1'>
        <MDBModalDialog size="lg">
          <MDBModalContent>
            <MDBModalHeader>
              <h5 className="modal-title">Withdraw Token</h5>
            </MDBModalHeader>
            <MDBModalBody>
              {errorMessage && <ErrorAlert message={errorMessage} onClose={() => setErrorMessage("")} />}
              <MDBInputGroup textBefore="Token index" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter token index as a uint32 decimal number (e.g., 18...)"
                  value={tokenIndex}
                  onChange={(e) => setTokenIndex(e.target.value)}
                  required
                />
              </MDBInputGroup>
              <MDBInputGroup textBefore="Recipient address" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Recipient Address as uint256 hexadecimal (e.g., 0x12...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </MDBInputGroup>
              <MDBInputGroup textBefore="Token amount" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter token amount as a uint64 decimal number (e.g., 18...)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </MDBInputGroup>
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={closeModal}>
                Close
              </MDBBtn>
              <MDBBtn color="primary" onClick={onConfirm} disabled={isExecuting}>
                {isExecuting ? <MDBSpinner size="sm" role="status" tag="span" /> : "Confirm"}
              </MDBBtn>
            </MDBModalFooter>
          </ MDBModalContent>
        </MDBModalDialog>
      </MDBModal>

      <ResultModal
        infoMessage={infoMessage}
        show={showResult}
        onClose={() => setShowResult(false)}
      />
    </>
    
  );
};

export default WithdrawTokenModal;