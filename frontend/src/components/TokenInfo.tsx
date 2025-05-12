import React, { useState } from "react";
import { selectTokenInfo } from '../data/token';
import { useAppSelector } from "../app/hooks";
import {
  MDBContainer,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBPagination,
  MDBPaginationItem,
  MDBPaginationLink
 } from "mdb-react-ui-kit";

export default function TokenInfo() {
  const tokenInfo = useAppSelector(selectTokenInfo);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(tokenInfo.length / rowsPerPage);

  const displayedTokens = tokenInfo.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <MDBContainer className="mt-3">
      <MDBTable>
        <MDBTableHead>
          <tr>
            <th scope='col'>#</th>
            <th scope='col'>Token Index</th>
            <th scope='col'>Address</th>
          </tr>
        </MDBTableHead>
        <MDBTableBody>
          {displayedTokens.map((token, index) => (
            <tr key={index}>
              <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
              <td>{token.tokenIdx}</td>
              <td>{token.address}</td>
            </tr>
          ))}
        </MDBTableBody>
      </MDBTable>
    
      <MDBPagination className="mb-0">
        <MDBPaginationItem disabled={currentPage === 1}>
          <MDBPaginationLink style={{ cursor: "pointer" }} onClick={() => handlePageChange(currentPage - 1)}>
            Previous
          </MDBPaginationLink>
        </MDBPaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <MDBPaginationItem key={i} active={currentPage === i + 1}>
            <MDBPaginationLink style={{ cursor: "pointer" }} onClick={() => handlePageChange(i + 1)}>
              {i + 1}
            </MDBPaginationLink>
          </MDBPaginationItem>
        ))}
        <MDBPaginationItem disabled={currentPage === totalPages}>
          <MDBPaginationLink style={{ cursor: "pointer" }} onClick={() => handlePageChange(currentPage + 1)}>
            Next
          </MDBPaginationLink>
        </MDBPaginationItem>
      </MDBPagination>
    </MDBContainer>
  )
}