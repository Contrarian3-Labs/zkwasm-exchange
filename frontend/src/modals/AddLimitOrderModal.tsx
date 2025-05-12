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
import { Form } from 'react-bootstrap';
import { useAppSelector } from '../app/hooks';
import { selectMarketInfo } from "../data/market";

export interface AddLimitOrderProps {
  show: boolean;
  onClose: () => void;
  handler: (marketId: bigint, flag: bigint, limitPrice: bigint, amount: bigint) => Promise<string | undefined>
}

const AddLimitOrderModal: React.FC<AddLimitOrderProps> = ({
  show,
  onClose,
  handler
}) => {
  const [marketId, setMarketId] = useState("");
  const [flag, setFlag] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const marketInfo = useAppSelector(selectMarketInfo);

  const activeMarkets = marketInfo.filter(market => market.status === 1);

  const closeModal = () => {
    setMarketId('');
    setFlag('');
    setLimitPrice('');
    setAmount('');
    setErrorMessage("");
    onClose();
  }

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!marketId) {
        throw new Error("Please select marketId");
      }
      if (!flag) {
        throw new Error("Please select buy/sell");
      }
      if (!limitPrice) {
        throw new Error("The limitPrice is missing");
      }
      if (!amount) {
        throw new Error("The amount is missing");
      }

      setIsExecuting(true);

      // Validate marketId
      const cleanedMarketId = parseInt(marketId.trim());
      validateIndex(cleanedMarketId, 64);
      // Validate limitPrice
      const cleanedLimitPrice = parseInt(limitPrice.trim());
      validateIndex(cleanedLimitPrice, 64);
      // Validate amount
      const cleanedAmount = parseInt(amount.trim());
      validateIndex(cleanedAmount, 64);

      const result = await handler(BigInt(cleanedMarketId), BigInt(flag), BigInt(cleanedLimitPrice), BigInt(cleanedAmount));
      if(result) {
        setInfoMessage(result);
        setShowResult(true);
      }
      closeModal();
    } catch (error) {
      const err = formatErrorMessage(error);
      setErrorMessage(`${err}`);
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
              <h5 className="modal-title">Add Limit Order</h5>
            </MDBModalHeader>
            <MDBModalBody>
              {errorMessage && <ErrorAlert message={errorMessage} onClose={() => setErrorMessage("")} />}
              <Form.Label htmlFor="inputMarketId">MarketId</Form.Label>
              <Form.Select
                id="inputMarketId"
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
              >
                <option value="" disabled>Select MarketId</option>
                {activeMarkets.map((market, index) => (
                  <option key={index} value={market.marketId}>
                    {market.marketId}
                  </option>
                ))}
              </Form.Select>
              <MDBInputGroup className="mb-3 mt-3">
                <Form.Select
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                >
                  <option value="" disabled>Select Buy/Sell</option>
                  <option value="1">Buy</option>
                  <option value="0">Sell</option>
                </Form.Select>
              </MDBInputGroup>
              <MDBInputGroup textBefore="LimitPrice" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter limitPrice as a uint64 decimal number (e.g., 18...)"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  required
                />
              </MDBInputGroup>
              <MDBInputGroup textBefore="Amount" className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter amount as a uint64 decimal number (e.g., 18...)"
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

export default AddLimitOrderModal;