import { useRef, useState } from "react";
import { ImageOff, Trash2, UploadCloud } from "lucide-react";

export function SingleImageUpload({ value, alt = "图片预览", accept, hint, error, loadFailed = false, assetLabel = "图标", previewRatio = "square", onLoadError, onFileSelect, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const hasPreview = Boolean(value) && !loadFailed;
  const openFilePicker = () => inputRef.current?.click();
  const selectFile = (file) => {
    if (file) onFileSelect?.(file);
  };

  return <div className="single-image-upload-field">
    <div
      className={`single-image-upload preview-${previewRatio} ${hasPreview ? "has-preview" : "is-empty"} ${dragging ? "is-dragging" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}
    >
      {hasPreview ? <>
        <div className="single-image-preview"><img src={value} alt={alt} onError={onLoadError}/></div>
        <div className="single-image-copy"><b>{`已上传${assetLabel}`}</b><span>{hint}</span><div className="single-image-actions"><button type="button" className="secondary-button" onClick={openFilePicker}><UploadCloud size={15}/>替换图片</button><button type="button" className="text-button danger-text" onClick={onRemove}><Trash2 size={14}/>删除</button></div></div>
      </> : <button type="button" className="single-image-empty-action" onClick={openFilePicker}>
        <span className="single-image-upload-icon">{loadFailed ? <ImageOff size={24}/> : <UploadCloud size={24}/>}</span>
        <b>{loadFailed ? "图片加载失败，请重新上传" : `点击或拖拽上传${assetLabel}`}</b>
        <span>{hint}</span>
      </button>}
      <input ref={inputRef} type="file" accept={accept} aria-label={`选择${assetLabel}`} onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }}/>
    </div>
    <small className={`single-image-error-slot ${error ? "has-error" : ""}`} role={error ? "alert" : undefined}>{error || "\u00a0"}</small>
  </div>;
}
