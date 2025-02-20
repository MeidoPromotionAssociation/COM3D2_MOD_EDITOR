package utilities

import (
	"crypto/sha256"
	"encoding/binary"
	"hash/fnv"
)

func GetStringHashInt32(s string) int32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return int32(h.Sum32()) //Cast to int32, possibly returning a negative number
}

func GetStringHashSHA256(s string) int32 {
	h := sha256.New()
	h.Write([]byte(s))
	sum := h.Sum(nil)
	return int32(binary.BigEndian.Uint32(sum[:4])) // Take the first 32 digits
}
