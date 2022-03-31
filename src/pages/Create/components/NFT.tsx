import axios from "axios";
import { sign } from "crypto";
import { Signer, ethers, BigNumber } from "ethers";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import useWeb3Modal from "../../../hooks/useWeb3Modal";
import { getSignerSignatureForMint, mint, uploadMedia } from "../../../rpc/index";

export type FormValues = {
  name: string;
  amount: string;
  description: string;
};

export function CreateNFT() {
  const { signer, signedInAddress } = useWeb3Modal();

  const [nftId, setNftId] = useState<number>(-1);
  const [inProgress, setInProgress] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const [files, setFiles] = useState<Array<File & { preview: string }>>([]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles.map((file) => Object.assign(file, { preview: URL.createObjectURL(file) })));
    },
  });

  const thumbs = files.map((file) => (
    <div className="avatar" key={file.name}>
      <div className="w-auto h-24 mb-8 rounded-btn">
        <img src={file.preview} alt={file.name} />
      </div>
    </div>
  ));

  useEffect(() => {
    files.forEach((file: any) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const onSubmit = handleSubmit((data) => {
    setNftId(-1);
    setInProgress(true);
    let metadataKey: string; // metadata json file name on s3
    // 1. upload files, and create metadata
    uploadMedia(files, data)
      .then((uploaded) => {
        console.log("upload file response: ", uploaded);
        metadataKey = uploaded.data.metadataKey;
        // 2. generate signature for mint
        return getSignerSignatureForMint(signedInAddress);
      })
      .then((signatureRes: any) => {
        console.log("signature: ", signatureRes.data.signature);
        // 3. send min transaction
        return mint(signatureRes.data.signature, data.amount, metadataKey, signer);
      })
      .then((mintRes: any) => {
        // 4. wait events for min transaction
        return mintRes.wait();
      })
      .then((eventRes: any) => {
        // 5. get minted token Id from event
        if (eventRes && eventRes.events) {
          console.log("events", eventRes.events);
          eventRes.events.forEach((entry: any) => {
            if (entry.event === "TransferSingle") {
              const nftId: BigNumber = entry.args.id;
              console.log("NFT id", nftId.toNumber());
              setNftId(nftId.toNumber());
            }
          });
        }
        toast.success("🦄 Minted NFT id: " + nftId, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        cleanup();
      })
      .catch((error) => {
        alert(error && error.message);
        cleanup();
      });
  });

  const cleanup = () => {
    setInProgress(false);
    reset();
    setFiles([]);
  };

  return (
    <div className="container w-[90%] mx-[5%] mt-[2%] min-h-screen ">
      <div className="flex flex-col">
        <div className="flex-none order-1">
          Mint NFT<div className="divider"></div>
        </div>
        <div className="flex-none order-2">
          <form onSubmit={onSubmit}>
            <div className="p-10 card bg-base-200">
              <section className="form-control">
                <div {...getRootProps({ className: "outline-dotted" })}>
                  <input
                    {...getInputProps({
                      className: "input",
                    })}
                  />
                  <div className="text-center mb-[19%]">
                    <p>Drag 'n' drop some files here, or click to select files</p>
                    <em>(Only *.jpeg and *.png images will be accepted)</em>
                  </div>
                </div>
                <aside>{thumbs}</aside>
              </section>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  placeholder="name"
                  className={errors.name ? "input input-error" : "input"}
                  {...register("name", {
                    required: true,
                  })}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt">{errors.name.message || "Required"}</span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">How Many?</span>
                </label>
                <input
                  type="number"
                  placeholder="amount"
                  min="1"
                  className={errors.name ? "input input-error" : "input"}
                  {...register("amount", {
                    required: true,
                  })}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt">{errors.name.message || "Required"}</span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  {...register("description", {
                    required: true,
                  })}
                  className={
                    errors.description
                      ? "h-24 textarea textarea-bordered textarea-error"
                      : "h-24 textarea textarea-bordered"
                  }
                  placeholder="Description"
                ></textarea>
                {errors.description && (
                  <label className="label">
                    <span className="label-text-alt">{errors.description.message || "Required"}</span>
                  </label>
                )}
              </div>
              <button type="submit" className="btn btn-primary mt-[2%]" disabled={inProgress}>
                Mint
              </button>
              <p>{inProgress ? "Mint in Progress..." : ""}</p>
              <p>{nftId >= 0 ? `Minted NFT id: ${nftId}` : ""}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
