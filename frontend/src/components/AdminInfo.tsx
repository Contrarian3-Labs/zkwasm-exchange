import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBTypography
} from "mdb-react-ui-kit";
import { UserState } from "../data/state";

interface AdminInfoProps {
  adminState: UserState | null;
}

export const AdminInfo: React.FC<AdminInfoProps> = ({ adminState }) => {
  return (
    <MDBContainer className="mt-3">
      <MDBRow>
        {adminState && adminState.player ? (
          Object.entries(adminState.player.data.positions).map(([tokenIndex, position]) => (
            <MDBCol md="6" key={tokenIndex}>
              <MDBCard className="mb-3">
                <MDBCardBody>
                  <MDBTypography tag="h6" className="mb-2">Token {tokenIndex}</MDBTypography>
                  <p className="mb-1"><strong>Balance:</strong> {position.balance}</p>
                  <p className="mb-0"><strong>Locked:</strong> {position.lock_balance}</p>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          ))
        ) : (
          <MDBCol md="12">
            <MDBCard className="mb-3">
              <MDBCardBody className="text-center">
                <MDBTypography tag="h6" className="mb-2">No admin available</MDBTypography>
                <p>Please check admin.</p>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        )}
      </MDBRow>
    </MDBContainer>
  )
}