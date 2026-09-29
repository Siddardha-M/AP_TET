import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Home from "./pages/Home.jsx";
import QuestionMenu from "./pages/QuestionMenu.jsx";
import Practice from "./pages/Practice.jsx";
import PracticeTest from "./pages/PracticeTest.jsx";
import PracticeTestResult from "./pages/PracticeTestResult.jsx";
import AllQuestions from "./pages/AllQuestions.jsx";
import Analysis from "./pages/Analysis.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* Analysis */}

        <Route
          path="/analysis"
          element={<Analysis />}
        />

        {/* Subject menu */}

        <Route
          path="/question-menu/:subjectId"
          element={<QuestionMenu />}
        />

        {/* Practice */}

        <Route
          path="/practice/:subjectId"
          element={<Practice />}
        />

        {/* Practice Test */}

        <Route
          path="/practice-test/:subjectId"
          element={<PracticeTest />}
        />

        {/* Practice Test Result */}

        <Route
          path="/practice-test/:subjectId/result"
          element={<PracticeTestResult />}
        />

        {/* All Questions */}

        <Route
          path="/all-questions/:subjectId"
          element={<AllQuestions />}
        />

        {/* Unknown URL */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;