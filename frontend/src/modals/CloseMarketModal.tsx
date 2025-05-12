import React, { useState } from "react";
import {
  MDBModal,
  MDBModalHeader,
  MDBModalBody,
  MDBModalFooter,
  MDBBtn,
  MDBSpinner,
  MDBModalContent,
  MDBModalDialog
} from "mdb-react-ui-kit";
import ErrorAlert from '../components/ErrorAlert';
import { validateIndex, formatErrorMessage } from "../utils/transaction";
import { ResultModal } from "./ResultModal";
import { useAppSelector } from '../app/hooks';
import { selectMarketInfo } from "../data/market";
import { Form } from 'react-bootstrap';

export interface CloseMarketProps {
  show: boolean;
  onClose: () => void;
  handler: (marketId: bigint) => Promise<string | undefined>
}

const CloseMarketModal: React.FC<CloseMarketProps> = ({
  show,
  onClose,
  handler
}) => {
  const [marketId, setMarketId] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const marketInfo = useAppSelector(selectMarketInfo);

  const activeMarkets = marketInfo.filter(market => market.status === 1);

  const closeModal = () => {
    setMarketId('');
    setErrorMessage("");
    onClose();
  }

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!marketId) {
        throw new Error("Please select marketId");
      }

      setIsExecuting(true);

      // Validate marketId
      const cleanedMarketId = parseInt(marketId.trim());
      validateIndex(cleanedMarketId, 64);
      
      const result = await handler(BigInt(cleanedMarketId));
      if(result) {
        setInfoMessage(result);
        setShowResult(true);
      }
      closeModal();
    } catch (error) {
      const err = formatErrorMessage(error);
      setErrorMessage(`closing market: ${err}`);
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
              <h5 className="modal-title">Close Market</h5>
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

export default CloseMarketModal;