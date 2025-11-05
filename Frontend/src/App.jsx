import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 메인페이지
import Header from '@/components/Mainpage/Header';
import Navbar from '@/components/Mainpage/Navbar';
import MainPage from '@/pages/MainPage';

// 회원관리
import Login from '@/pages/management/Login';
import SignUp from '@/pages/management/SignUp';
import FindPassword from '@/pages/management/FindPassword';
import ResetPassword from '@/pages/management/ResetPassword';
import MyPage from '@/pages/management/MyPage';
import AdminPage from '@/pages/management/AdminPage';
import UsersDetail from '@/components/admin/tabs/UsersDetail';
import MyPageEdit from '@/pages/management/MyPageEdit';
import { LoginContextProvider } from '@/contexts/LoginContext';

// 유기견 조회
import LookupMain from '@/pages/Lookup/LookupMain';
import DogDetail_1 from '@/pages/Lookup/DogDetail_1';
import DogDetail_2 from '@/pages/Lookup/DogDetail_2';
import PredictDog from '@/pages/Lookup/PredictDog';
import SearchResultPage from '@/pages/Lookup/SearchResultPage';

// 유기견 신고
import ReportMain from '@/pages/Report/ReportMain';
import ReportLostwrite from '@/pages/Report/ReportLostwrite';
import ReportHow from '@/pages/Report/ReportHow';
import ReportView from '@/pages/Report/ReportView';
import ReportLostEdit from '@/pages/Report/ReportLostEdit';

// 유기견 입양
import AdoptMain from '@/pages/Adopt/AdoptMain';
import AdoptDetail from '@/pages/Adopt/AdoptDetail';
import AdoptProcess from '@/pages/Adopt/AdoptProcess';

// 보호소 찾기
import Shelters from '@/pages/Shelters';

// 공지사항
import NoticeMain from '@/pages/Notice/NoticeMain';
import NoticeWrite from '@/pages/Notice/NoticeWrite';
import NoticeDetail from '@/pages/Notice/NoticeDetail';
import { NoticeContextProvider } from '@/contexts/NoticeContext';

// 문의사항
import InquiryMain from '@/pages/Inquiry/InquiryMain';
import InquiryWrite from '@/pages/Inquiry/InquiryWrite';
import InquiryDetail from '@/pages/Inquiry/InquiryDetail';
import InquiryEdit from '@/pages/Inquiry/InquiryEdit';

function App() {
    
  return (
    <div className="App">
      <LoginContextProvider>
        <Header />
        <Navbar />

        <NoticeContextProvider>
          <Routes>
            <Route path="/" element={<MainPage />} />

            {/* 사용자 정보 관리 */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/findpassword" element={<FindPassword />} />
            <Route
              path="/mypage" element={<MyPage />} />
            <Route
              path="/adminpage" element={<AdminPage />} />
            <Route path="/adminpage/users/:id" element={<UsersDetail />} />
            <Route path="/mypage/edit" element={<MyPageEdit />} />
            <Route path="/shelters" element={<Shelters />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 유기견 조회 */}
            <Route path="/lookup" element={<LookupMain />} />
            <Route path="/lookup/:dogId" element={<DogDetail_1 />} />
            <Route path="/lookup/predict-dog" element={<PredictDog />} />
            <Route path="/lookup/predict-dog/:dogId" element={<DogDetail_2 />} />
            <Route path="/lookup/search-result" element={<SearchResultPage />} />

            {/* 유기견 신고 */}
            <Route path="/report" element={<ReportMain />} />
            <Route path="/report/write" element={<ReportLostwrite />} />
            <Route path="/report/view" element={<ReportView />} />
            <Route path="/report/edit" element={<ReportLostEdit />} />
            <Route path="/report/how" element={<ReportHow />} />

            {/* 유기견 입양 */}
            <Route path="/adopt" element={<AdoptMain />} />
            <Route path="/adopt/:dogId" element={<AdoptDetail />} />
            <Route path="/adopt/process" element={<AdoptProcess />} />

            {/* 공지사항 */}
            <Route path="/notice" element={<NoticeMain />} />
            <Route path="/notice/write" element={<NoticeWrite />} />
            <Route path="/notice/:id" element={<NoticeDetail />} />

            {/* 문의사항 */}
            <Route path="/inquiry" element={<InquiryMain />} />
            <Route path="/inquiry/write" element={<InquiryWrite />} />
            <Route path="/inquiry/:id" element={<InquiryDetail />} />
            <Route path="/inquiry/edit" element={<InquiryEdit />} />
          </Routes>
        </NoticeContextProvider>
      </LoginContextProvider>
    </div>
  );
}

export default App;
