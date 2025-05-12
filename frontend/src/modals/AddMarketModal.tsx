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
import { validateIndex, formatErrorMessage } from "../utils/transaction";
import { ResultModal } from "./ResultModal";

export interface AddMarketProps {
  show: boolean;
  onClose: () => void;
  handler: (tokenAIdx: bigint, tokenBIdx: bigint, lastPrice: bigint) => Promise<string | undefined>
}

const AddMarketModal: React.FC<AddMarketProps> = ({
  show,
  onClose,
  handler
}) => {
  const [tokenIndexA, setTokenIndexA] = useState('');
  const [tokenIndexB, setTokenIndexB] = useState('');
  const [lastPrice, setLastPrice] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showResult, setShowResult] = useState(false);

  const closeModal = () => {
    setTokenIndexA('');
    setTokenIndexB('');
    setLastPrice('');
    setErrorMessage("");
    onClose();
  }

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!tokenIndexA) {
        throw new Error("Token index A is missing");
      }

      if (!tokenIndexB) {
        throw new Error("Token index B is missing");
      }

      if (!lastPrice) {
        throw new Error("The lastPrice is missing");
      }

      setIsExecuting(true);

      // Validate token index A
      const cleanedTokenIndexA = parseInt(tokenIndexA.trim());
      validateIndex(cleanedTokenIndexA);
      // Validate token index B
      const cleanedTokenIndexB = parseInt(tokenIndexB.trim());
      validateIndex(cleanedTokenIndexB);

      // Validate lastPrice
      const cleanedLastPrice = parseInt(lastPrice.trim());
      validateIndex(cleanedLastPrice);

      const result = await handler(BigInt(cleanedTokenIndexA), BigInt(cleanedTokenIndexB), BigInt(cleanedLastPrice));
      if(result) {
        setInfoMessage(result);
        setShowResult(true);
      }
      closeModal();
    } catch (error) {
      const err = formatErrorMessage(error);
      setErrorMessage(`adding market: ${err}`);
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
              <h5 className="modal-title">Add Market</h5>
            </MDBModalHeader>
            <MDBModalBody>
              {errorMessage && <ErrorAlert message={errorMessage} onClose={() => setErrorMessage("")} />}
              <MDBInputGroup textBefore="Token index A" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter token index A as a uint64 decimal number (e.g., 18...)"
                  value={tokenIndexA}
                  onChange={(e) => setTokenIndexA(e.target.value)}
                  required
                />
              </MDBInputGroup>
              <MDBInputGroup textBefore="Token index B" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter token index B as a uint64 decimal number (e.g., 18...)"
                  value={tokenIndexB}
                  onChange={(e) => setTokenIndexB(e.target.value)}
                  required
                />
              </MDBInputGroup>
              <MDBInputGroup textBefore="LastPrice" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter lastPrice as a uint64 decimal number (e.g., 18...)"
                  value={lastPrice}
                  onChange={(e) => setLastPrice(e.target.value)}
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

export default AddMarketModal;