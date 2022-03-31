import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  amount: number;
  price: number;
};

type AddItemModalProps = {
  inProgress: boolean;
  marketItemId: number;
  nftBalance: number;
  isOpen: boolean;
  NFTlink: string | undefined;
  onClose: () => void;
  onListing: (formData: FormValues) => void;
};

export function ListSellModal({inProgress, marketItemId, nftBalance, isOpen, NFTlink, onClose, onListing }: AddItemModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>();
  const onSubmit = handleSubmit((data) => {
    onListing(data);
    reset();
  });

  // useEffect(() => {
  //   if (!isOpen) reset();
  // });
  useEffect(() => {
    reset();
  }, [!isOpen]);

  return (
    <div className={isOpen ? "modal modal-open" : "modal"}>
      <form onSubmit={onSubmit}>
        <div className="modal-box">
          <div className="card bg-base-200 lg:card-side shadow-xl">
            <figure>
              <img className="object-cover h-48 w-96" src={NFTlink} alt="NFT" />
            </figure>
          </div>
          <div className="card-body">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Amount</span>
              </label>
              <input
                type="number"
                placeholder="0"
                max={nftBalance}
                min={1}
                className={errors.amount ? "input input-error" : "input"}
                {...register("amount", {
                  required: true,
                  min: 1,
                })}
              />
              {errors.amount && (
                <label className="label">
                  <span className="label-text-alt">{errors.amount.message || "Required"}</span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Price (Unit: ZYC)</span>
              </label>
              <input
                type="number"
                step="1"
                placeholder="0"
                min="1"
                className={errors.price ? "input input-error" : "input"}
                {...register("price", {
                  required: true,
                  min: 0,
                })}
              />
              {errors.price && (
                <label className="label">
                  <span className="label-text-alt">{errors.price.message || "Required"}</span>
                </label>
              )}
            </div>
            <div className="modal-action">
              <button type="submit" className="btn btn-primary" disabled={inProgress}>
                List
              </button>
              <button type="button" onClick={onClose} className="btn">
                Close
              </button>
            </div>
            <p>{inProgress ? 'inProgress...': ''}</p>
            <p>{marketItemId >= 0 ? `List successfully, market item id ${marketItemId}`: ''}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
