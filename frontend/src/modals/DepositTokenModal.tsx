import React, { useState } from "react";
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
import { validateHexString, validateIndex, formatErrorMessage } from "../utils/transaction";
import { ResultModal } from "./ResultModal";

export interface DepositTokenProps {
  show: boolean;
  onClose: () => void;
  handler: (pid: string, tokenIdx: bigint, amount: bigint) => Promise<string | undefined>
}

const DepositTokenModal: React.FC<DepositTokenProps> = ({
  show,
  onClose,
  handler
}) => {
  const [pid, setPid] = useState('');
  const [tokenIndex, setTokenIndex] = useState('');
  const [amount, setAmount] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showResult, setShowResult] = useState(false);

  const closeModal = () => {
    setPid('');
    setTokenIndex('');
    setAmount('');
    setErrorMessage("");
    onClose();
  }

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!pid) {
        throw new Error("The player id is missing");
      }

      if (!tokenIndex) {
        throw new Error("Token index is missing");
      }

      if (!amount) {
        throw new Error("Token amount is missing");
      }

      setIsExecuting(true);

      // Validate pid
      const cleanedPid = pid.trim();
      validateHexString(cleanedPid, 256);

      // Validate token index
      const cleanedTokenIndex = parseInt(tokenIndex.trim());
      validateIndex(cleanedTokenIndex);

      // Validate token amount
      const cleanedAmount = parseInt(amount.trim());
      validateIndex(cleanedAmount, 64);

      const result = await handler(cleanedPid, BigInt(cleanedTokenIndex), BigInt(cleanedAmount));
      if(result) {
        setInfoMessage(result);
        setShowResult(true);
      }
      closeModal();
    } catch (error) {
      const err = formatErrorMessage(error);
      setErrorMessage(`depositing token: ${err}`);
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
              <h5 className="modal-title">Deposit Token</h5>
            </MDBModalHeader>
            <MDBModalBody>
              {errorMessage && <ErrorAlert message={errorMessage} onClose={() => setErrorMessage("")} />}
              <MDBInputGroup textBefore="Player id" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter player id as uint256 hexadecimal (e.g., 0x12...)"
                  value={pid}
                  onChange={(e) => setPid(e.target.value)}
                  required
                />
              </MDBInputGroup>
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

export default DepositTokenModal;