import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// Global Build Variables
const GITHUB_OWNER = typeof __MMT_GITHUB_OWNER__ !== "undefined" ? __MMT_GITHUB_OWNER__ : "faizanyounusrcmemon-blip";
const GITHUB_REPO_FRONTEND = typeof __MMT_GITHUB_REPO_FRONTEND__ !== "undefined" ? __MMT_GITHUB_REPO_FRONTEND__ : "Makki-Madni-Travel-Software";
const GITHUB_REPO_BACKEND = typeof __MMT_GITHUB_REPO_BACKEND__ !== "undefined" ? __MMT_GITHUB_REPO_BACKEND__ : "makki-madni-backend";
const BUILD_TIME = typeof __MMT_BUILD_TIME__ !== "undefined" ? __MMT_BUILD_TIME__ : new Date().toISOString();

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(GITHUB_REPO_FRONTEND);
  const [currentPath, setCurrentPath] = useState("");
  const [repoContents, setRepoContents] = useState([]);
  const [fileHistory, setFileHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Repository Contents / Folder Structure
  const fetchRepoContents = async (repo, path = "") => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${path}`
      );
      setRepoContents(Array.isArray(res.data) ? res.data : [res.data]);
      setCurrentPath(path);
      setSelectedFile(null);
      setFileHistory([]);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "GitHub API Error",
        text: err.response?.data?.message || "Failed to fetch files from GitHub.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch File Commits History
  const fetchFileHistory = async (file) => {
    setLoading(true);
    setSelectedFile(file);
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${GITHUB_OWNER}/${selectedRepo}/commits?path=${file.path}`
      );
      setFileHistory(res.data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "File history load nahi ho saki.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open History Modal
  const handleOpenModal = () => {
    setShowHistoryModal(true);
    fetchRepoContents(selectedRepo, "");
  };

  // Switch Repository
  const handleRepoChange = (repo) => {
    setSelectedRepo(repo);
    fetchRepoContents(repo, "");
  };

  // Navigate Back in Folder Tree
  const handleBreadcrumbClick = (index) => {
    const parts = currentPath.split("/").slice(0, index + 1);
    const newPath = parts.join("/");
    fetchRepoContents(selectedRepo, newPath);
  };

  // Format Pakistan Standard Time (PKT)
  const formatPKT = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const filteredItems = repoContents.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>
      {/* Top Header Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-dark text-white shadow-sm border-0">
            <div className="card-body d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h3 className="mb-1">Makki Madni Travel Agency</h3>
                <p className="mb-0 text-muted">
                  System Live Clock (PKT): {formatPKT(time)}
                </p>
              </div>

              {/* Last System Update & File History Button */}
              <div className="text-end mt-2 mt-md-0">
                <span className="badge bg-secondary mb-2 d-inline-block p-2">
                  Last Build: {formatPKT(BUILD_TIME)}
                </span>
                <div>
                  <button
                    className="btn btn-primary btn-sm rounded-pill shadow-sm"
                    onClick={handleOpenModal}
                  >
                    📂 View All Files & History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub History Modal */}
      {showHistoryModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  📂 Repository Explorer & File History
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowHistoryModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                {/* Repo Switcher Buttons */}
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        selectedRepo === GITHUB_REPO_FRONTEND
                          ? "btn-success"
                          : "btn-outline-light"
                      }`}
                      onClick={() => handleRepoChange(GITHUB_REPO_FRONTEND)}
                    >
                      Frontend Repo
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        selectedRepo === GITHUB_REPO_BACKEND
                          ? "btn-success"
                          : "btn-outline-light"
                      }`}
                      onClick={() => handleRepoChange(GITHUB_REPO_BACKEND)}
                    >
                      Backend Repo
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="w-50">
                    <input
                      type="text"
                      className="form-control form-control-sm bg-secondary text-white border-0"
                      placeholder="Search files or folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Breadcrumbs Navigation */}
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb bg-secondary p-2 rounded">
                    <li className="breadcrumb-item">
                      <button
                        className="btn btn-link btn-sm p-0 text-white text-decoration-none fw-bold"
                        onClick={() => fetchRepoContents(selectedRepo, "")}
                      >
                        Root ({selectedRepo})
                      </button>
                    </li>
                    {currentPath &&
                      currentPath.split("/").map((part, index) => (
                        <li
                          key={index}
                          className="breadcrumb-item text-white"
                        >
                          <button
                            className="btn btn-link btn-sm p-0 text-info text-decoration-none"
                            onClick={() => handleBreadcrumbClick(index)}
                          >
                            {part}
                          </button>
                        </li>
                      ))}
                  </ol>
                </nav>

                {loading ? (
                  <div className="text-center my-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    {/* Left Side: Directory Structure */}
                    <div className="col-md-6 border-end border-secondary">
                      <h6>Directory Contents</h6>
                      <ul className="list-group list-group-flush rounded">
                        {filteredItems.length === 0 ? (
                          <li className="list-group-item bg-dark text-muted">
                            No files found.
                          </li>
                        ) : (
                          filteredItems.map((item) => (
                            <li
                              key={item.sha}
                              className={`list-group-item bg-dark text-white d-flex justify-content-between align-items-center cursor-pointer ${
                                selectedFile?.path === item.path
                                  ? "active bg-secondary"
                                  : ""
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                if (item.type === "dir") {
                                  fetchRepoContents(selectedRepo, item.path);
                                } else {
                                  fetchFileHistory(item);
                                }
                              }}
                            >
                              <span>
                                {item.type === "dir" ? "📁" : "📄"} {item.name}
                              </span>
                              <span className="badge bg-outline-light text-muted">
                                {item.type}
                              </span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    {/* Right Side: Selected File Commit History */}
                    <div className="col-md-6">
                      <h6>
                        {selectedFile
                          ? `Commit History: ${selectedFile.name}`
                          : "Select a file to view history"}
                      </h6>
                      {!selectedFile ? (
                        <p className="text-muted small">
                          Left panel se kisi file par click karein taake uski full commit history aur updates dikhein.
                        </p>
                      ) : fileHistory.length === 0 ? (
                        <p className="text-muted small">
                          Is file ki koi history nahi mili.
                        </p>
                      ) : (
                        <div
                          style={{
                            maxHeight: "350px",
                            overflowY: "auto",
                          }}
                        >
                          {fileHistory.map((commitObj) => (
                            <div
                              key={commitObj.sha}
                              className="card bg-secondary text-white mb-2 p-2"
                            >
                              <div className="d-flex justify-content-between">
                                <strong className="text-info small">
                                  {commitObj.commit.author.name}
                                </strong>
                                <span className="small text-light">
                                  {formatPKT(commitObj.commit.author.date)}
                                </span>
                              </div>
                              <p className="mb-1 small">
                                {commitObj.commit.message}
                              </p>
                              <a
                                href={commitObj.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-warning small text-decoration-none"
                              >
                                View Commit ({commitObj.sha.substring(0, 7)})
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
