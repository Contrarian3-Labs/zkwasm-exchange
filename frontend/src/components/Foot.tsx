import React from 'react';
import { MDBFooter, MDBContainer, MDBRow, MDBCol, MDBIcon } from 'mdb-react-ui-kit';

export default function Footer() {
  return (
    <MDBFooter bgColor='light' className='text-center text-lg-start text-muted'>
      <section className='p-1 border-bottom mt-5'>
      </section>

      <section className='mt-2'>
        <MDBContainer className='text-center text-md-start mt-5'>
          <MDBRow className='mt-3'>
            <MDBCol md="3" lg="4" xl="3" className='mx-auto mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>
                <MDBIcon icon="gem" className="me-3" />
                Delphinus Lab Pty Ltd
              </h6>
              <p>
                Delphinus Lab provides solutions for trustless computation and application SDK based on the ZKWasm virtual machine.
              </p>
            </MDBCol>

            <MDBCol md="2" lg="2" xl="2" className='mx-auto mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>Products</h6>
              <p>
                <a href='#!' className='text-reset'>
                  ZKWASM
                </a>
              </p>
              <p>
                <a href='#!' className='text-reset'>
                  ZKWASM mini rollup
                </a>
              </p>
              <p>
                <a href='#!' className='text-reset'>
                  ZKWASM hub
                </a>
              </p>
            </MDBCol>

            <MDBCol md="3" lg="2" xl="2" className='mx-auto mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>Useful links</h6>
              <p>
                <a href='#!' className='text-reset'>
                  Pricing
                </a>
              </p>
              <p>
                <a href='#!' className='text-reset'>
                  Settings
                </a>
              </p>
              <p>
                <a href='#!' className='text-reset'>
                  Orders
                </a>
              </p>
            </MDBCol>

            <MDBCol md="4" lg="3" xl="3" className='mx-auto mb-md-0 mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>Contact</h6>
              <p>
                <MDBIcon icon="envelope" className="me-3" />
                info@delphinuslab.com
              </p>
              <div>
                <a href='#!' className='me-4 text-reset'>
                  <MDBIcon fab icon="facebook-f" />
                </a>
                <a href='#!' className='me-4 text-reset'>
                  <MDBIcon fab icon="twitter" />
                </a>
                <a href='#!' className='me-4 text-reset'>
                  <MDBIcon fab icon="google" />
                </a>
                <a href='#!' className='me-4 text-reset'>
                  <MDBIcon fab icon="instagram" />
                </a>
                <a href='#!' className='me-4 text-reset'>
                  <MDBIcon fab icon="linkedin" />
                </a>
                <a href='#!' className='me-4 text-reset'>
                  <MDBIcon fab icon="github" />
                </a>
              </div>

            </MDBCol>
          </MDBRow>
        </MDBContainer>
      </section>

      <div className='text-center p-4' style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
        © 2021 Copyright:
        <a className='text-reset fw-bold' href='https://mdbootstrap.com/'>
          delphinuslab.com
        </a>
      </div>
    </MDBFooter>
  );
}
