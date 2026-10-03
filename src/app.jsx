import { useEffect, useRef, useState } from "react";
import "./App.css";
const MAX_MODELS = 5;
function App() {
  const modelInputRef = useRef(null);
  const productInputRef = useRef(null);
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [product, setProduct] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [imageReady, setImageReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // --------------------------------------------------------
  // Persistent browser storage
  // IndexedDB is used instead of localStorage because images
  // can easily exceed localStorage's small quota.
  // --------------------------------------------------------
  const DB_NAME = "fashion_ai_db";
  const DB_VERSION = 1;
  const STORE_NAME = "assets";
  const openDB = () =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  const dbGetAll = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  const dbPut = async (item) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, "readwrite")
        .objectStore(STORE_NAME)
        .put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };
  const dbDelete = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, "readwrite")
        .objectStore(STORE_NAME)
        .delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  // Load models/product from IndexedDB once.
  useEffect(() => {
    let cancelled = false;
    const loadSavedData = async () => {
      try {
        let assets = await dbGetAll();
        let savedModels = assets.filter(
          (item) => item.type === "model"
        );
        let savedProduct = assets.find(
          (item) => item.type === "product"
        );
        // One-time migration from the old localStorage model storage.
        if (savedModels.length === 0) {
          const oldModels = localStorage.getItem(
            "fashion_ai_models"
          );
          if (oldModels) {
            try {
              const parsedModels = JSON.parse(oldModels);
              for (const model of parsedModels) {
                await dbPut({
                  ...model,
                  type: "model",
                });
              }
              savedModels = parsedModels.map((model) => ({
                ...model,
                type: "model",
              }));
              localStorage.removeItem(
                "fashion_ai_models"
              );
            } catch {
              // Ignore invalid/partially-written old storage.
            }
          }
        }
        if (cancelled) return;
        setModels(
          savedModels.slice(0, MAX_MODELS)
        );
        const savedSelectedModel =
          localStorage.getItem(
            "fashion_ai_selected_model"
          );
        const validSelected = savedModels.some(
          (model) =>
            model.id === savedSelectedModel
        );
        const nextSelected = validSelected
          ? savedSelectedModel
          : savedModels[0]?.id ?? null;
        setSelectedModelId(nextSelected);
        if (nextSelected) {
          localStorage.setItem(
            "fashion_ai_selected_model",
            nextSelected
          );
        } else {
          localStorage.removeItem(
            "fashion_ai_selected_model"
          );
        }
        if (savedProduct) {
          setProduct(savedProduct);
        }
      } catch (error) {
        console.error(
          "Failed to load saved Fashion AI data:",
          error
        );
      }
    };
    loadSavedData();
    return () => {
      cancelled = true;
    };
  }, []);
  const selectedModel = models.find(
    (model) => model.id === selectedModelId
  );
  // --------------------------------------------------------
  // Poll local automation bridge while workflow is running.
  // --------------------------------------------------------
  useEffect(() => {
    if (!isRunning) return;
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8765/status"
        );
        const statusData =
          await response.json();
        if (cancelled) return;
        // AI image completed
        if (
          statusData.imageReady ||
          statusData.generatedModel ||
          statusData.imageUrl
        ) {
          setImageReady(true);
          if (statusData.imageUrl) {
            setGeneratedImageUrl(
              `${statusData.imageUrl}?t=${Date.now()}`
            );
          }
        }
        // Fashion reel completed
        if (
          statusData.videoReady ||
          statusData.fashionReel ||
          statusData.videoUrl
        ) {
          setVideoReady(true);
          if (statusData.videoUrl) {
            setGeneratedVideoUrl(
              `${statusData.videoUrl}?t=${Date.now()}`
            );
          }
        }
        // Complete
        if (statusData.completed) {
          setImageReady(true);
          setVideoReady(true);
          setStatus(
            "Automation completed ✓"
          );
          setIsRunning(false);
          return;
        }
        // Failed
        if (statusData.failed) {
          setStatus(
            statusData.message ||
            "Automation failed"
          );
          setIsRunning(false);
          return;
        }
        // Running
        if (statusData.running) {
          setStatus(
            statusData.message ===
              "Automation running"
              ? "Processing..."
              : statusData.message ||
                "Processing..."
          );
        }
      } catch (error) {
        console.error(
          "Status check failed:",
          error
        );
      }
    };
    checkStatus();
    const interval = setInterval(
      checkStatus,
      2000
    );
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isRunning]);
  // --------------------------------------------------------
  // Upload model
  // --------------------------------------------------------
  const handleModelUpload = async (event) => {
    const file =
      event.target.files?.[0];
    if (!file) return;
    if (models.length >= MAX_MODELS) {
      alert(
        "Maximum 5 models allowed."
      );
      event.target.value = "";
      return;
    }
    try {
      const image =
        await fileToDataUrl(file);
      const newModel = {
        id: crypto.randomUUID(),
        type: "model",
        name: file.name,
        image,
      };
      await dbPut(newModel);
      setModels(
        (currentModels) => [
          ...currentModels,
          newModel,
        ]
      );
      setSelectedModelId(
        newModel.id
      );
      localStorage.setItem(
        "fashion_ai_selected_model",
        newModel.id
      );
    } catch (error) {
      console.error(
        "Model save failed:",
        error
      );
      alert(
        "Model save nahi ho paya. Please try another image."
      );
    } finally {
      event.target.value = "";
    }
  };
  // --------------------------------------------------------
  // Select model
  // --------------------------------------------------------
  const selectModel = (modelId) => {
    setSelectedModelId(modelId);
  };
  // --------------------------------------------------------
  // Delete model
  // --------------------------------------------------------
  const deleteModel = async (modelId) => {
    const remainingModels =
      models.filter(
        (model) =>
          model.id !== modelId
      );
    try {
      await dbDelete(modelId);
    } catch (error) {
      console.error(
        "Model delete failed:",
        error
      );
    }
    setModels(
      remainingModels
    );
    if (
      selectedModelId === modelId
    ) {
      const nextModel =
        remainingModels[0];
      if (nextModel) {
        setSelectedModelId(
          nextModel.id
        );
        localStorage.setItem(
          "fashion_ai_selected_model",
          nextModel.id
        );
      } else {
        setSelectedModelId(null);
        localStorage.removeItem(
          "fashion_ai_selected_model"
        );
      }
    }
  };
  // --------------------------------------------------------
  // Upload product
  // --------------------------------------------------------
  const handleProductUpload =
    async (event) => {
      const file =
        event.target.files?.[0];
      if (!file) return;
      try {
        const productData = {
          id: "current-product",
          type: "product",
          name: file.name,
          image:
            await fileToDataUrl(file),
        };
        await dbPut(productData);
        setProduct(productData);
      } catch (error) {
        console.error(
          "Product save failed:",
          error
        );
        alert(
          "Product save nahi ho paya. Please try another image."
        );
      } finally {
        event.target.value = "";
      }
    };
  // --------------------------------------------------------
  // Start automation
  // --------------------------------------------------------
  const startAutomation =
    async () => {
      if (!selectedModel) {
        alert(
          "Please select a model first."
        );
        return;
      }
      if (!product) {
        alert(
          "Please upload a product image first."
        );
        return;
      }
      setIsRunning(true);
      setImageReady(false);
      setVideoReady(false);
      setGeneratedImageUrl(null);
      setGeneratedVideoUrl(null);
      setStatus(
        "Processing..."
      );
      try {
        const response =
          await fetch(
            "http://127.0.0.1:8765/start",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                modelImage:
                  selectedModel.image,
                productImage:
                  product.image,
              }),
            }
          );
        const data =
          await response.json();
        if (!response.ok) {
          throw new Error(
            data.error ||
              "Automation could not start"
          );
        }
        setStatus(
          "Automation started successfully."
        );
      } catch (error) {
        console.error(
          "Automation error:",
          error
        );
        setStatus(
          "Automation failed."
        );
        setIsRunning(false);
        alert(
          "Automation start nahi hui.\n\n" +
          error.message
        );
      }
    };
  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div>
          <div className="logo">
            <span className="logo-icon">
              ✦
            </span>
            FASHION AI
          </div>
          <p className="tagline">
            Turn products into fashion content
          </p>
        </div>
        <div className="status-pill">
          <span className="status-dot"></span>
          System Ready
        </div>
      </header>
      <main className="container">
        {/* MODEL SECTION */}
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 01
              </span>
              <h2>
                Model
              </h2>
              <p>
                Select the model you want to use.
              </p>
            </div>
            <span className="model-counter">
              {models.length}/{MAX_MODELS}
            </span>
          </div>
          {/* CURRENT MODEL */}
          {selectedModel ? (
            <div className="current-model">
              <div className="current-model-image">
                <img
                  src={selectedModel.image}
                  alt="Current model"
                />
              </div>
              <div className="current-model-info">
                <div>
                  <span className="label">
                    CURRENT MODEL
                  </span>
                  <h3>
                    {selectedModel.name}
                  </h3>
                </div>
                <span className="selected-badge">
                  ✓ Selected
                </span>
              </div>
            </div>
          ) : (
            <div
              className="no-model"
              onClick={() =>
                modelInputRef.current?.click()
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  modelInputRef.current?.click();
                }
              }}
            >
              <div className="upload-icon">
                ＋
              </div>
              <strong>
                No model selected
              </strong>
              <span>
                Click here to upload your model
              </span>
            </div>
          )}
          {/* MODEL LIBRARY */}
          <div className="library-header">
            <div>
              <span className="label">
                MODEL LIBRARY
              </span>
              <h3>
                Your Models
              </h3>
            </div>
            <button
              className="secondary-btn"
              onClick={() =>
                modelInputRef.current?.click()
              }
              disabled={
                models.length >= MAX_MODELS
              }
            >
              + Add Model
            </button>
          </div>
          <div className="model-grid">
            {models.map(
              (model, index) => {
                const isSelected =
                  model.id ===
                  selectedModelId;
                return (
                  <div
                    className={`model-card ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    key={model.id}
                    onClick={() =>
                      selectModel(model.id)
                    }
                  >
                    <div className="model-card-image">
                      <img
                        src={model.image}
                        alt={`Model ${index + 1}`}
                      />
                      {isSelected && (
                        <span className="model-check">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="model-card-footer">
                      <span>
                        Model {index + 1}
                      </span>
                      <button
                        className="delete-model"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteModel(
                            model.id
                          );
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              }
            )}
            {/* EMPTY ADD CARD */}
            {models.length <
              MAX_MODELS && (
              <button
                className="add-model-card"
                onClick={() =>
                  modelInputRef.current?.click()
                }
              >
                <span>
                  ＋
                </span>
                <strong>
                  Add Model
                </strong>
              </button>
            )}
          </div>
          <input
            ref={modelInputRef}
            id="model-upload"
            type="file"
            accept="image/*"
            hidden
            onChange={
              handleModelUpload
            }
          />
        </section>
        {/* PRODUCT SECTION */}
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 02
              </span>
              <h2>
                Product
              </h2>
              <p>
                Upload the clothing or product you want
                to showcase.
              </p>
            </div>
          </div>
          {!product ? (
            <button
              className="upload-box product-upload"
              onClick={() =>
                productInputRef.current?.click()
              }
            >
              <div className="upload-icon">
                ＋
              </div>
              <strong>
                Upload Product Image
              </strong>
              <span>
                JPG, PNG or WEBP
              </span>
            </button>
          ) : (
            <div className="product-preview">
              <img
                src={product.image}
                alt="Selected product"
              />
              <div className="product-info">
                <div>
                  <span className="label">
                    PRODUCT
                  </span>
                  <h3>
                    {product.name}
                  </h3>
                </div>
                <button
                  className="change-btn"
                  onClick={() =>
                    productInputRef.current?.click()
                  }
                >
                  Replace
                </button>
              </div>
            </div>
          )}
          <input
            ref={productInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={
              handleProductUpload
            }
          />
        </section>
        {/* START */}
        <section className="action-section">
          <button
            className="start-btn"
            onClick={
              startAutomation
            }
            disabled={isRunning}
          >
            <span>
              {isRunning
                ? "●"
                : "▶"}
            </span>
            {isRunning
              ? "Processing..."
              : "Start Automation"}
          </button>
          <p>
            Selected Model + Product → AI Image → Fashion Reel
          </p>
        </section>
        {/* STATUS */}
        <section className="status-card">
          <div className="status-header">
            <div>
              <span className="eyebrow">
                AUTOMATION
              </span>
              <h2>
                Progress
              </h2>
            </div>
            <span
              className={`live-status ${
                isRunning
                  ? "active"
                  : ""
              }`}
            >
              {status}
            </span>
          </div>
          <div className="steps">
            {/* STEP 1 */}
            <div className="step">
              <div
                className={`step-number ${
                  selectedModel
                    ? "completed"
                    : ""
                }`}
              >
                {selectedModel
                  ? "✓"
                  : "1"}
              </div>
              <div>
                <strong>
                  Model
                </strong>
                <span>
                  {selectedModel
                    ? "Model ready"
                    : "Select a model"}
                </span>
              </div>
            </div>
            <div
              className={`step-line ${
                selectedModel &&
                product
                  ? "completed-line"
                  : ""
              }`}
            ></div>
            {/* STEP 2 */}
            <div className="step">
              <div
                className={`step-number ${
                  product
                    ? "completed"
                    : ""
                }`}
              >
                {product
                  ? "✓"
                  : "2"}
              </div>
              <div>
                <strong>
                  Product
                </strong>
                <span>
                  {product
                    ? "Product ready"
                    : "Waiting for product"}
                </span>
              </div>
            </div>
            <div
              className={`step-line ${
                imageReady
                  ? "completed-line"
                  : ""
              }`}
            ></div>
            {/* STEP 3 */}
            <div className="step">
              <div
                className={`step-number ${
                  imageReady
                    ? "completed"
                    : isRunning
                      ? "active-step"
                      : ""
                }`}
              >
                {imageReady
                  ? "✓"
                  : "3"}
              </div>
              <div>
                <strong>
                  AI Image
                </strong>
                <span>
                  {imageReady
                    ? "Image generated"
                    : isRunning
                      ? "Gemini generation"
                      : "Waiting to start"}
                </span>
              </div>
            </div>
            <div
              className={`step-line ${
                videoReady
                  ? "completed-line"
                  : ""
              }`}
            ></div>
            {/* STEP 4 */}
            <div className="step">
              <div
                className={`step-number ${
                  videoReady
                    ? "completed"
                    : isRunning
                      ? "active-step"
                      : ""
                }`}
              >
                {videoReady
                  ? "✓"
                  : "4"}
              </div>
              <div>
                <strong>
                  Fashion Reel
                </strong>
                <span>
                  {videoReady
                    ? "Reel generated"
                    : isRunning
                      ? "Flow video generation"
                      : "Waiting to start"}
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* RESULT */}
        <section className="result-card">
          <span className="eyebrow">
            RESULT
          </span>
          <h2>
            Your generated content
          </h2>
          {!generatedImageUrl &&
          !generatedVideoUrl ? (
            <div className="result-placeholder">
              <span>
                ✦
              </span>
              <p>
                Your AI-generated image and video
                will appear here.
              </p>
            </div>
          ) : (
            <div className="result-content">
              {/* GENERATED IMAGE */}
              {generatedImageUrl && (
                <div className="generated-item">
                  <span className="result-label">
                    AI IMAGE
                  </span>
                  <img
                    src={generatedImageUrl}
                    alt="Generated fashion model"
                  />
                </div>
              )}
              {/* GENERATED VIDEO */}
              {generatedVideoUrl && (
                <div className="generated-item">
                  <span className="result-label">
                    FASHION REEL
                  </span>
                  <video
                    src={generatedVideoUrl}
                    controls
                    playsInline
                  />
                  <a
                    className="result-download"
                    href={
                      generatedVideoUrl
                    }
                    download="fashion_reel.mp4"
                  >
                    Download Reel
                  </a>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      {/* FOOTER */}
      <footer>
        <span>
          FASHION AI
        </span>
        <span>
          AI Fashion Content Automation
        </span>
      </footer>
    </div>
  );
}
export default App;