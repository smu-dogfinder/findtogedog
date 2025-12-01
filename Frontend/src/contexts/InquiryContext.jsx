import React, { createContext, useContext, useState } from 'react';

export const InquiryContext = createContext({
  inquiry: undefined,
  setInquiry: () => { },
});

export const InquiryContextProvider = (props) => {
  const [inquiry, setInquiry] = useState();

  return (
    <InquiryContext.Provider value={{ inquiry: inquiry, setInquiry: setInquiry }}>
      {props.children}
    </InquiryContext.Provider>
  )
};

export const useInquiry = () => useContext(InquiryContext);