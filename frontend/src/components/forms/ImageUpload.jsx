import { useId, useState } from "react";
import { imageError, readImage } from "../../utils/reportRules";
import { Button } from "../common/UI";
export default function ImageUpload({
  label = "Item photograph (optional)",
  value = "",
  onChange,
  onBusy,
}) {
  const [error, setError] = useState(""),
    [key, setKey] = useState(0),
    id = useId();
  async function choose(e) {
    const file = e.target.files[0];
    setError("");
    if (!file) return;
    const failure = imageError(file);
    if (failure) {
      setError(failure);
      onChange("");
      setKey(key + 1);
      return;
    }
    onBusy?.(true);
    try {
      onChange(await readImage(file));
    } catch (err) {
      setError(err.message);
      onChange("");
    } finally {
      onBusy?.(false);
    }
  }
  return (
    <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-4">
      <label className="block text-xs font-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        key={key}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={`${id}-help`}
        className="my-3 block w-full min-w-0 text-xs file:mr-3 file:rounded file:border file:border-line file:bg-white file:px-3 file:py-2"
        onChange={choose}
      />
      <p id={`${id}-help`} className="text-xs leading-6 text-muted">
        JPEG, PNG or WebP · At most 5 MB · Keep private ownership evidence out of public photos.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-800">
          {error}
        </p>
      )}
      {value && (
        <>
          <img
            src={value}
            alt="Selected image preview"
            className="my-3 max-h-48 max-w-full object-contain"
          />
          <Button
            variant="text"
            onClick={() => {
              onChange("");
              setKey(key + 1);
              setError("");
            }}
          >
            Remove image
          </Button>
        </>
      )}
    </div>
  );
}
